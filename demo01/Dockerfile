FROM docker.io/library/node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs questions.mjs ./
COPY --chown=node:node public ./public
COPY --chown=node:node tests ./tests
USER node
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.mjs"]
