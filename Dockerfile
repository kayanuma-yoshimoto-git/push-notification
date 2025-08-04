FROM node:18

RUN apt-get update && \
  apt-get install -y openjdk-17-jre && \
  apt-get clean

WORKDIR /app

COPY ./serverless-infra /app

RUN npm install
RUN npx serverless dynamodb install

EXPOSE 8000 20002

CMD ["npx", "serverless", "offline", "start"]