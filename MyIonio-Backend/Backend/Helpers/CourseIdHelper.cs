using System.Security.Cryptography;
using System.Text;

namespace IonioPortal.Helpers
{
    public static class CourseIdHelper
    {
        public static Guid GenerateId(string courseName, string day, string timeStart, string timeEnd, string room)
        {
            // Normalize inputs
            var input = $"{courseName?.Trim().ToLower()}|{day?.Trim().ToLower()}|{timeStart?.Trim()}|{timeEnd?.Trim()}|{room?.Trim().ToLower()}";
            
            using (MD5 md5 = MD5.Create())
            {
                byte[] hash = md5.ComputeHash(Encoding.UTF8.GetBytes(input));
                return new Guid(hash);
            }
        }
    }
}
