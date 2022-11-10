FROM ubuntu:latest as base
RUN apt-get update -y

RUN apt-get install -y zsh
RUN chsh -s $(which zsh)
RUN echo 'autoload -Uz compinit promptinit' >> ~/.zshrc
RUN echo 'compinit' >> ~/.zshrc
RUN echo 'promptinit' >> ~/.zshrc
RUN echo 'export PS1="%B%F{cyan}%(4~|...|)%3~%F{white} %# %b%f%k"' >> ~/.zshrc
RUN echo 'alias ls="ls -al --color=auto"' >> ~/.zshrc

RUN apt-get install -y wget
ENV NVM_DIR /root/.nvm
RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
RUN . $NVM_DIR/nvm.sh \
    && nvm install 18 \
    && nvm alias default node \
    && nvm use node \
    && npm i -g npm@latest

RUN apt-get install -y git
