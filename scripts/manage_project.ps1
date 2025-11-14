# 项目管理脚本 - 维度空间
# 使用方法: .\scripts\manage_project.ps1 -Command [command_name]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('deploy', 'test', 'clean', 'list', 'help')]
    [string]$Command
)

function Write-Header {
    Write-Host "===== 维度空间 项目管理工具 =====" -ForegroundColor Cyan
}

function Write-Help {
    Write-Header
    Write-Host "可用命令:"
    Write-Host "  .\scripts\manage_project.ps1 -Command test     # 在浏览器中测试网站"
    Write-Host "  .\scripts\manage_project.ps1 -Command clean    # 清理临时文件"
    Write-Host "  .\scripts\manage_project.ps1 -Command list     # 列出项目结构"
    Write-Host "  .\scripts\manage_project.ps1 -Command help     # 显示帮助信息"
    Write-Host "===========================================" -ForegroundColor Cyan
}

function Deploy-Project {
    Write-Header
    Write-Host "网站已配置为纯本地存储模式，无需部署后端服务。" -ForegroundColor Green
    Write-Host "请直接使用静态文件托管服务部署public目录下的文件。" -ForegroundColor Green
}

function Test-Project {
    Write-Header
    Write-Host "启动本地测试..." -ForegroundColor Yellow
    
    try {
        # 打开测试页面
        $testFormPath = "$PSScriptRoot\..\public\test_form.html"
        if (Test-Path $testFormPath) {
            Write-Host "正在打开测试页面..." -ForegroundColor Green
            Start-Process $testFormPath
            
            # 也打开主页面
            $indexPath = "$PSScriptRoot\..\public\index.html"
            if (Test-Path $indexPath) {
                Write-Host "正在打开主页面..." -ForegroundColor Green
                Start-Process $indexPath
            }
        } else {
            Write-Host "错误: 找不到测试页面" -ForegroundColor Red
        }
    } catch {
        Write-Host "测试时发生错误: $_" -ForegroundColor Red
    }
}

function Clean-Project {
    Write-Header
    Write-Host "清理临时文件..." -ForegroundColor Yellow
    
    try {
        # 清理可能的临时文件
        $tempFiles = @(
            "$PSScriptRoot\..\*.log",
            "$PSScriptRoot\..\*.tmp",
            "$PSScriptRoot\..\node_modules"
        )
        
        foreach ($file in $tempFiles) {
            if (Test-Path $file) {
                Write-Host "删除: $file" -ForegroundColor Green
                Remove-Item -Path $file -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
        
        Write-Host "清理完成!" -ForegroundColor Green
    } catch {
        Write-Host "清理时发生错误: $_" -ForegroundColor Red
    }
}

function List-Project {
    Write-Header
    Write-Host "项目文件结构:" -ForegroundColor Yellow
    
    try {
        # 列出主要目录
        Write-Host "\npublic 目录 (网站前端文件):" -ForegroundColor Green
        Get-ChildItem -Path "$PSScriptRoot\..\public" | Format-Table Name, Length, LastWriteTime
        
        Write-Host "\nconfig 目录 (配置文件):" -ForegroundColor Green
        Get-ChildItem -Path "$PSScriptRoot\..\config" | Format-Table Name, Length, LastWriteTime
        
        Write-Host "\ndocs 目录 (文档):" -ForegroundColor Green
        Get-ChildItem -Path "$PSScriptRoot\..\docs" | Format-Table Name, Length, LastWriteTime
        
        Write-Host "\nscripts 目录 (脚本):" -ForegroundColor Green
        Get-ChildItem -Path "$PSScriptRoot\..\scripts" | Format-Table Name, Length, LastWriteTime
        
        Write-Host "\n根目录文件:" -ForegroundColor Green
        Get-ChildItem -Path "$PSScriptRoot\.." | Where-Object { -not $_.PSIsContainer } | Format-Table Name, Length, LastWriteTime
    } catch {
        Write-Host "列出文件时发生错误: $_" -ForegroundColor Red
    }
}

# 根据命令执行相应功能
switch ($Command) {
    'test' { Test-Project }
    'clean' { Clean-Project }
    'list' { List-Project }
    'help' { Write-Help }
    default { Write-Help }
}

Write-Host "\n操作完成。" -ForegroundColor Cyan
