FROM node:22-bookworm-slim

WORKDIR /workspace

RUN npm install -g @openai/codex

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
