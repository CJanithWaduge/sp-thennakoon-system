$files = Get-ChildItem -Path "src" -Recurse -Include *.jsx,*.js -Exclude db.js,client.js
foreach ($file in $files) {
    if ($file.FullName -match "api\\client\.js" -or $file.FullName -match "db\\db\.js") { continue }
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ($content.Contains("window.api")) {
        $content = $content.Replace("window.api", "api")
        if (-not $content.Contains("import api from")) {
            # Base directory is "src"
            $rel = ""
            $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 4) # \src...
            $depth = ($relativePath.Split("\")).Count - 1
            
            if ($depth -eq 1) { $rel = "./api/client" }
            elseif ($depth -eq 2) { $rel = "../api/client" }
            elseif ($depth -eq 3) { $rel = "../../api/client" }
            else { $rel = "./api/client" }
            
            $importStr = "import api from '$rel';`r`n"
            $content = $importStr + $content
        }
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Updated $($file.Name) with depth $depth"
    }
}
