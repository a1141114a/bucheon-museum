# 环境检查（2026-11-04）

| 工具 | 实际结果 |
|---|---|
| Node.js | v24.22.1，可运行 |
| npm | 系统 PATH 中不可用；在工作区 `work/npm-bootstrap` 获取 npm 10.9.2 CLI，用于本次安装与验证，未全局安装 |
| pnpm | 11.25.0，可执行；受当前 Windows 符号链接权限限制，未用于最终安装 |
| Python | 系统 `python` 指向不可用的 WindowsApps 别名；Codex 捆绑 Python 3.12.14 可用 |
| Blender | 初次未安装；用户随后安装并打开。通过运行进程定位 `D:/blender/blender.exe`，5.2.3 LTS；后台 bpy 建模及文件回读验证已通过 |
| GitHub | 已连接并可只读列出仓库；未选定项目仓库、未推送、未部署 |

当前捆绑运行时：

```powershell
$runtime = 'C:/Users/aaa/.cache/codex-runtimes/codex-primary-runtime/dependencies'
& "$runtime/node/bin/node.exe" --version
& "$runtime/python/python.exe" --version
```

在项目目录运行本次使用的 npm CLI（仅对当前交付目录相对位置有效）：

```powershell
node ../../work/npm-bootstrap/package/bin/npm-cli.js run dev
node ../../work/npm-bootstrap/package/bin/npm-cli.js test
node ../../work/npm-bootstrap/package/bin/npm-cli.js run build
```

项目本身不依赖此特殊路径。其他电脑安装 Node.js LTS（包含 npm）即可按 README 的标准命令使用。Blender 脚本除 Python 语法检查外，也已在 Blender 5.2.3 中实际执行并验证导出文件。

```powershell
& 'D:/blender/blender.exe' --background --python-exit-code 1 --python blender/scripts/create_test_vessel.py
& 'D:/blender/blender.exe' --background --python-exit-code 1 --python blender/scripts/validate_test_model.py
```

沙箱内的回环端口无法被预览浏览器访问，实际浏览器验证使用本机权限启动、仅绑定 127.0.0.1:5174 的 Vite 服务。
