using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.Extensions.DependencyInjection; // For IServiceCollection and AddScoped
using System;
using System.Net.Http; // For HttpClient
using System.Threading.Tasks; // For Task

namespace PromptSyncBlazorApp
{
    /// <summary>
    /// Main entry point for the Blazor WebAssembly application.
    /// Configures services and the root component.
    /// </summary>
    public class Program
    {
        public static async Task Main(string[] args)
        {
            // WebAssemblyHostBuilder provides configuration for the Blazor app.
            var builder = WebAssemblyHostBuilder.CreateDefault(args);

            // Adds the root component <App> to the DOM element with id 'app'.
            // This 'app' div is defined in wwwroot/index.html.
            builder.RootComponents.Add<App>("#app");

            // Register HttpClient for making HTTP requests.
            // This is useful if the Blazor app needs to call external APIs (e.g., a backend for PromptSync).
            // It's configured as a scoped service.
            // The BaseAddress is set to the application's base URI, which is suitable for many cases,
            // but can be overridden if calling different APIs.
            builder.Services.AddScoped(sp => new HttpClient
            {
                // The BaseAddress will be something like "chrome-extension://[EXTENSION_ID]/wwwroot/"
                // which is fine if you are fetching resources relative to the extension.
                // For external APIs, you'd set a different BaseAddress or use full URLs in requests.
                BaseAddress = new Uri(builder.HostEnvironment.BaseAddress)
            });

            // Build and run the Blazor application.
            await builder.Build().RunAsync();
        }
    }
}
