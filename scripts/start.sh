#!/bin/bash

pname="node urpg-battle-bot-app.js"

pid=`/bin/ps -fu $USER|grep "$pname" | grep -v "grep" | awk '{print $2}'`
if [[ $pid -gt 0 ]]; then
  kill $pid
  while kill -0 $pid; do
    sleep 1
  done
fi

yum install -y nodejs npm
cd /etc/battlebot /urpg-battle-bot
cp /etc/battlebot/.env /etc/battlebot/urpg-battle-bot
npm install
#nohup npm run start &