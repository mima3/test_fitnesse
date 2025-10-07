# Selenium + Chrome + Xvfb + noVNC を含む公式イメージ
FROM eclipse-temurin:21-jre-jammy

# FitNesse/HSACのバージョンやURLを引数で指定
ARG HSAC_URL=https://github.com/fhoeben/hsac-fitnesse-fixtures/releases/download/5.3.22/hsac-fitnesse-fixtures-5.3.22-standalone.zip

ENV LANG=C.UTF-8

USER root
WORKDIR /opt/fitnesse

# 必要なツール
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates unzip gnupg \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/*

# fitnesseのセットアップ
RUN curl -fsSL -o /tmp/hsac.zip "$HSAC_URL" \
  && unzip -q /tmp/hsac.zip -d /opt/fitnesse \
  && rm /tmp/hsac.zip

COPY ./BrowserTests.wiki /opt/fitnesse/FitNesseRoot/FrontPage/BrowserTests.wiki
COPY ./content.txt /opt/fitnesse/FitNesseRoot/FrontPage/content.txt
COPY ./SlimJs.wiki /opt/fitnesse/FitNesseRoot/FrontPage/SlimJs.wiki
COPY ./SlimJsStd.wiki /opt/fitnesse/FitNesseRoot/FrontPage/SlimJsStd.wiki
COPY ./slimjs_std /opt/fitnesse/slimjs_std

# node.jsの設定
RUN npm install -g slimjs
WORKDIR /opt/fitnesse/slimjs_std
RUN npm install

# fitnesseの起動
WORKDIR /opt/fitnesse
ENTRYPOINT [ "java", "-Xmx100M", "-jar", "/opt/fitnesse/fitnesse-standalone.jar", "-p", "8080", "-e", "0", "-v" ]
