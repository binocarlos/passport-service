# Do the npm install or yarn install in the full image
FROM mhart/alpine-node:6.11.3
MAINTAINER brandonesbox@gmail.com
WORKDIR /app/auth
COPY ./package.json /app/auth/package.json
RUN npm install --production

# And then copy over node_modules, etc from that stage to the smaller base image
FROM mhart/alpine-node:base-8
WORKDIR /app/auth
COPY --from=0 /app/auth . 
COPY . .

ENTRYPOINT ["node", "index.js"]
