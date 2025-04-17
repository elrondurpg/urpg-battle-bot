yum install -y nodejs npm
cd /home/ec2-user/urpg-battle-bot
cp /home/ec2-user/.env /home/ec2-user/urpg-battle-bot
npm install
nohup npm run start