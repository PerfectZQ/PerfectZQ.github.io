---
layout: post
title: zsh config
tag: Linux
---

## OSX
### zsh plugins
```shell
# 代码自动提示，当自动提示出现后，按 ➡ (右方向键)就能把自动提示的命令输入到当前的 Terminal
$ brew install zsh-autosuggestions
# 查看说明
$ brew info zsh-autosuggestions
# 启用插件
$ echo  "source /usr/local/share/zsh-autosuggestions/zsh-autosuggestions.zsh" >> ~/.zshrc
$ source ~/.zshrc


# 彩色高亮 ls
$ gem install colorls

# 添加到 zsh plugins 
$ [[ -s $(brew --prefix)/etc/profile.d/autojump.sh ]] && . $(brew --prefix)/etc/profile.d/autojump.sh
```
### zsh common plugins enable
```shell
$ cd ~/.oh-my-zsh/custom/plugins
$ git clone https://github.com/paulirish/git-open
$ git clone https://github.com/zsh-users/zsh-autosuggestions
$ git clone https://github.com/zsh-users/zsh-syntax-highlighting

$ vim ~/.zshrc
plugins=(
   git
   zsh-syntax-highlighting
   zsh-autosuggestions
   git-open
)
$ source ~/.zshrc
```

## Ubutun

## Windows

