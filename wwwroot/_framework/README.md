# Blazor Framework Files

This directory would normally be populated by the .NET build process (`dotnet publish` or `dotnet build`).
It contains the Blazor WebAssembly runtime, .NET assemblies (DLLs), and other files necessary for the Blazor application to run.

Key files that would be present here include:
- `blazor.webassembly.js` (This is correctly referenced in `wwwroot/index.html` but its content is part of the SDK)
- `dotnet.wasm` (The .NET WebAssembly runtime)
- `dotnet.js`
- `blazor.boot.json` (Metadata about the application and its dependencies)
- Application-specific DLLs (e.g., `PromptSyncBlazorApp.dll`)
- Framework DLLs (e.g., `Microsoft.AspNetCore.Components.WebAssembly.dll`, `System.Private.CoreLib.dll`, etc.)

**IMPORTANT FOR MANUAL SETUP:**
To make this extension work after downloading the code, the user would need to:
1. Have the .NET SDK installed (version matching the .csproj, e.g., .NET 8).
2. Navigate to the `PromptSyncBlazorApp` directory.
3. Run `dotnet publish -c Release`.
4. Copy the contents of `PromptSyncBlazorApp/bin/Release/netX.X/publish/wwwroot/_framework/*` to this `wwwroot/_framework/` directory.
5. Copy `PromptSyncBlazorApp/bin/Release/netX.X/publish/wwwroot/PromptSyncBlazorApp.styles.css` (if it exists) to `wwwroot/css/`.

Without these files, the Blazor popup will not load and will likely show "Loading..." indefinitely or an error in the console.
The `blazor.webassembly.js` file itself is crucial and is provided by the Blazor SDK. For this stub, we assume it will be correctly placed here during a proper build.
For now, I will also create an empty `blazor.webassembly.js` to prevent a 404 error, but it will not function.
