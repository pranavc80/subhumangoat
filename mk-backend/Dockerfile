# Use Bun image
FROM oven/bun:1.1 as base
WORKDIR /usr/src/app

# Install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Copy dependencies and source code
FROM base AS release
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Environment setup
ENV NODE_ENV=production

# Run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "index.ts" ]
