namespace MyIonio.Kafka
{
    /// <summary>
    /// Abstraction over Kafka message production.
    /// Keeping this behind an interface makes the controller testable
    /// and allows swapping the implementation in tests without a real broker.
    /// </summary>
    public interface IKafkaProducerService
    {
        /// <summary>
        /// Serialises <typeparamref name="T"/> as JSON and publishes it to the given Kafka topic.
        /// </summary>
        Task ProduceAsync<T>(string topic, T message);
    }
}
