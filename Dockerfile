#stage 1
FROM node:alpine3.15 as build
MAINTAINER Niksa Blonder "niksa.blonder@nist.gov"
WORKDIR /app
#COPY . .
COPY package.json package-lock.json ./
COPY oar-dmp ./oar-dmp
COPY lib ./lib
RUN npm install

#change directory to oar-dmp
WORKDIR /app/oar-dmp
#build angular app
RUN npm run build --prod

#stage 2
FROM nginx:alpine
COPY --from=build /app/oar-dmp/dist/dmp_ui2 /usr/share/nginx/html