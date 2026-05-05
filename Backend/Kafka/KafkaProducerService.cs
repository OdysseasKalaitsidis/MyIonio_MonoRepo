using Confluent.Kafka;
using System.Text.Json;

namespace MyIonio.Kafka
{
  
    public class KafkaProducerService : IKafkaProducerService, IDisposable
    {
        private readonly IProducer<Null, string> _producer;
        private readonly ILogger<KafkaProducerService> _logger;

        public KafkaProducerService(IConfiguration configuration, ILogger<KafkaProducerService> logger)
        {
            _logger = logger;

            var bootstrapServers = configuration["Kafka:BootstrapServers"] ?? "localhost:9092";

            var config = new ProducerConfig
            {
                BootstrapServers = bootstrapServers,
                // Acks.All = broker + all in-sync replicas must acknowledge before returning.
                // Suitable for a PoC; in production you'd tune this vs throughput.
                Acks = Acks.All,
                // Retry up to 3 times on transient failures
                MessageSendMaxRetries = 3,
                // Wait 100 ms between retries
                RetryBackoffMs = 100
            };

            _producer = new ProducerBuilder<Null, string>(config).Build();

            _logger.LogInformation("Kafka producer initialised. BootstrapServers: {Servers}", bootstrapServers);
        }

        /// <inheritdoc />
        public async Task ProduceAsync<T>(string topic, T message)
        {
            try
            {
                var json = JsonSerializer.Serialize(message);
                var kafkaMessage = new Message<Null, string> { Value = json };

                var result = await _producer.ProduceAsync(topic, kafkaMessage);

                _logger.LogInformation(
                    "Kafka event published. Topic: {Topic} | Partition: {Partition} | Offset: {Offset}",
                    result.Topic, result.Partition.Value, result.Offset.Value);
            }
            catch (ProduceException<Null, string> ex)
            {
                // Non-fatal: the review was already saved to the DB.
                // The Kafka pipeline failing does not roll back the user's review.
                _logger.LogError(ex,
                    "Failed to publish Kafka event to topic '{Topic}'. Error: {Reason}",
                    topic, ex.Error.Reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error publishing Kafka event to topic '{Topic}'.", topic);
            }
        }

        public void Dispose()
        {
            // Flush any pending messages before the process exits
            _producer.Flush(TimeSpan.FromSeconds(5));
            _producer.Dispose();
        }
    }
}
