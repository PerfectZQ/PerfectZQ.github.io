---
layout: post
title: Ubuntu Remote Desktop
tag: Linux
---

## Windows 远程桌面连接 Ubuntu ECS
### XRDP
```shell
# 1. === Connect to remote Ubuntu ECS ===
$ sudo apt-get update
$ sudo apt-get upgrade -f
$ sudo apt-get clean

# Remove
# $ sudo apt-get remove --purge -y vnc4server tightvncserver xrdp xubuntu-desktop xfce4

# VNC (Virtual Network Console)
# $ sudo apt-get install -y vnc4server tightvncserver

# Install xrdp
$ sudo apt-get install -y xrdp

# Choose your ubuntu desktop env
$ sudo apt-get install ubuntu-desktop		    # Default Ubuntu desktop
$ sudo apt-get install ubuntu-gnome-desktop	    # Ubuntu Gnome (Official flavor)
$ sudo apt-get install xfce4			        # LXDE
$ sudo apt-get install lxde			            # LXDE
$ sudo apt-get install kubuntu-desktop		    # KDE

# `gdm3` is greater and `lightdm` is faster
$ sudo systemctl enable gdm
$ sudo systemctl start gdm

# Config for current user
$ echo "xfce4-session" > ~/.xsession
# Or you could add to this scripts for all users
$ vim /etc/xrdp/startwm.sh
# ===> Config for all users
echo "xfce4-session" > ~/.xsession

# Start service
$ sudo systemctl enable xrdp
$ sudo systemctl restart xrdp

# Allow xRDP through the local firewall if firewall is active
$ sudo ufw allow 3389/tcp

# 2. === Windows ===
$ Win + R
mstsc
# type Ubuntu's IP
# Xorg -> username & password
```

除了上述方法外，还可以直接使用现成的脚本安装 xrdp，[xRDP Installation Script (free)](http://www.c-nergy.be/products.html)
```shell
$ wget https://www.c-nergy.be/downloads/xrdp-installer-1.1.zip
$ unzip xrdp-installer-1.1.zip
$ chmod +x xrdp-installer-1.1.sh
$ ./xrdp-installer-1.1.sh
```

### VNC
在 Linux 上基于 VNC 协议的实现工具有很多，如 TigerVNC、TightVNC、Vino、x11VNC、VNC Server

#### Server 
```shell
# Install TigerVNC server
$ sudo apt install -y tigervnc-standalone-server tigervnc-xorg-extension tigervnc-viewer

# Install desktop
$ sudo apt install -y ubuntu-gnome-desktop

# Solve grey screen
$ sudo apt install --no-install-recommends -y ubuntu-desktop gnome-panel gnome-settings-daemon metacity nautilus gnome-terminal

# Install input
$ sudo apt install xserver-xorg-input-all

# Install dpi
$ sudo apt-get install -y xfonts-100dpi
$ sudo apt-get install -y xfonts-75dpi

$ sudo systemctl enable gdm
$ sudo systemctl start gdm

# Config vnc server password
$ vncpasswd

$ vim ~/.vnc/xstartup
#!/bin/sh
# Start Gnome 3 Desktop 
[ -x /etc/vnc/xstartup ] && exec /etc/vnc/xstartup
[ -r $HOME/.Xresources ] && xrdb $HOME/.Xresources
vncconfig -iconic &
dbus-launch --exit-with-session gnome-session &

# Usages
$ vncserver --help

# Open 0.0.0.0:5901, default 127.0.0.1:5901
$ vncserver -localhost no -depth 32 -geometry 1920x1080 :1
New 'ubuntu1804:1 (zhangqiang)' desktop at :1 on machine ubuntu1804
Starting applications specified in /home/zhangqiang/.vnc/xstartup
Log file is /home/zhangqiang/.vnc/ubuntu1804:1.log
Use xtigervncviewer -SecurityTypes VncAuth,TLSVnc -passwd /home/zhangqiang/.vnc/passwd ubuntu1804:1 to connect to the VNC server.

# Close all remote desktops
$ vncserver -kill :*
# Close desktop :1
$ vncserver -kill :1

# === Systemd Daemon Config (Optional)
# The @ symbol at the end of the name will let us pass in an argument we can use in the service configuration.
# We'll use this to specify the VNC display port we want to use when we manage the service.
$ sudo vim /etc/systemd/system/vncserver@.service
[Unit]
Description=Start TightVNC server at startup
After=syslog.target network.target

[Service]
Type=forking
User=zhangqiang
Group=zhangqiang
WorkingDirectory=/home/zhangqiang

PIDFile=/home/zhangqiang/.vnc/%H:%i.pid
ExecStartPre=/usr/bin/vncserver -kill :%i > /dev/null 2>&1
ExecStart=/usr/bin/vncserver -localhost no -depth 32 -geometry 1920x1080 :%i
ExecStop=/usr/bin/vncserver -kill :%i

[Install]
WantedBy=multi-user.target

# Reload & Start
$ sudo systemctl daemon-reload
$ sudo systemctl enable vncserver@1.service
$ sudo systemctl start vncserver@1
$ sudo systemctl status vncserver@1
```

重新安装
```shell
$ sudo apt remove -y --purge tigervnc-standalone-server tigervnc-xorg-extension tigervnc-viewer ubuntu-gnome-desktop ubuntu-desktop gnome-panel gnome-settings-daemon metacity nautilus gnome-terminal
$ sudo apt install -y --purge tigervnc-standalone-server tigervnc-xorg-extension tigervnc-viewer ubuntu-gnome-desktop ubuntu-desktop gnome-panel gnome-settings-daemon metacity nautilus gnome-terminal
```

#### Client 
* [Windows Client Install - VNC Viewer for Windows](https://www.realvnc.com/en/connect/download/viewer/)

```console
File -> New Connection...
# Note ip and port's seprator is ::, not :
VNC Server -> 10.53.7.150::5901
```

* [UltraVNC Viewer (Windows 下这个更好用点)](https://www.uvnc.com/downloads/ultravnc.html)

>Note: 按下键盘上的 SCROLL-LOCK(在 HOME 键上面) 键后，就可以发送 ctrl tab 之类的命令给远程服务器，而不是发送给本机

## 安装搜狗输入法
```shell
# 卸载默认的 ibus 非常难用
$ sudo apt remove --purge ibus
# 卸载顶部任务面板的键盘指示
$ sudo apt remove indicator-keyboard
# 安装fcitx输入法框架
$ sudo apt intsall -y fcitx-table-wbpy fcitx-config-gtk
# 切换fcitx输入法
$ im-config -n fcitx
# 重启生效
$ sudo reboot
# 下载搜狗输入法
$ wget http://cdn2.ime.sogou.com/dl/index/1571302197/sogoupinyin_2.3.1.0112_amd64.deb?st=PmFfEwDeA5KA6gN1j5T7ZQ&e=1587363129&fn=sogoupinyin_2.3.1.0112_amd64.deb
# 安装
$ sudo dpkg -i sogoupinyin_2.3.1.0112_amd64.deb
# 修复损坏的包
$ sudo apt-get install -f
# 打开 fcitx 配置
$ fcitx-config-gtk3
```

