#!bash

cd Backend
./gradlew clean build

cd ../routineAgent

./gradlew clean build

cd ..

docker compose up -d --build