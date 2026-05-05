using Confluent.Kafka;
using MyIonio.Interfaces;
using MyIonio.Kafka.Events;
using System.Text.Json;

namespace MyIonio.Kafka
{
    /// <summary>
    /// Background service (IHostedService) that consumes the "note-summarized" Kafka topic.
    ///
    /// Interview talking points:
    /// - IHostedService lifecycle: StartAsync is called on app startup, StopAsync on shutdown.
    ///   The consumer loop runs in a background Task so it never blocks the main thread.
    /// - IServiceScopeFactory: DbContext is a Scoped service but this is a Singleton.
    ///   We create a new scope per message to get a fresh DbContext — standard .NET pattern.
    /// - Manual offset commit (enable.auto.commit = false): we commit ONLY after the DB write
    ///   succeeds. If the backend crashes mid-update, Kafka replays the message on restart.
    ///   This gives us at-least-once delivery semantics.
    /// </summary>
    public class KafkaConsumerService : IHostedService, IDisposable
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<KafkaConsumerService> _logger;
        private readonly IConfiguration _configuration;
        private IConsumer<Ignore, string>? _consumer;
        private Task? _consumeTask;
        private CancellationTokenSource? _cts;

        public KafkaConsumerService(
            IServiceScopeFactory scopeFactory,
            ILogger<KafkaConsumerService> logger,
            IConfiguration configuration)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _configuration = configuration;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            var bootstrapServers = _configuration["Kafka:BootstrapServers"] ?? "localhost:9092";

            var config = new ConsumerConfig
            {
                BootstrapServers = bootstrapServers,
                GroupId = "myionio-notes-group",
                AutoOffsetReset = AutoOffsetReset.Earliest,
                // Manual commit: offset committed only after successful DB write
                EnableAutoCommit = false
            };

            _consumer = new ConsumerBuilder<Ignore, string>(config).Build();
            _consumer.Subscribe("note-summarized");

            _logger.LogInformation("KafkaConsumerService started. Subscribed to 'note-summarized'.");

            _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            _consumeTask = Task.Run(() => ConsumeLoop(_cts.Token), cancellationToken);

            return Task.CompletedTask;
        }

        private async Task ConsumeLoop(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    var result = _consumer!.Consume(token);
                    if (result?.Message?.Value == null) continue;

                    var evt = JsonSerializer.Deserialize<NoteSummarizedEvent>(
                        result.Message.Value,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (evt == null)
                    {
                        _logger.LogWarning("Received null NoteSummarizedEvent — skipping.");
                        _consumer.Commit(result);
                        continue;
                    }

                    _logger.LogInformation(
                        "Consumed note-summarized event | NoteId: {NoteId} | Success: {Success}",
                        evt.NoteId, evt.Success);

                    // Create a new scope for the scoped DbContext
                    using var scope = _scopeFactory.CreateScope();
                    var notesService = scope.ServiceProvider.GetRequiredService<INotesService>();

                    await notesService.UpdateNoteSummaryAsync(
                        evt.NoteId,
                        evt.Summary,
                        evt.Success,
                        evt.ErrorMessage);

                    // Commit offset only after successful DB write
                    _consumer.Commit(result);

                    _logger.LogInformation(
                        "Note {NoteId} updated to status '{Status}'.",
                        evt.NoteId, evt.Success ? "ready" : "failed");
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (ConsumeException ex)
                {
                    _logger.LogError(ex, "Kafka consume error: {Reason}", ex.Error.Reason);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error in KafkaConsumerService loop.");
                }
            }
        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("KafkaConsumerService stopping...");
            _cts?.Cancel();

            if (_consumeTask != null)
                await _consumeTask.WaitAsync(cancellationToken);

            _consumer?.Close();
            _logger.LogInformation("KafkaConsumerService stopped.");
        }

        public void Dispose()
        {
            _consumer?.Dispose();
            _cts?.Dispose();
        }
    }
}
