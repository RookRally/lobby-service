ARG DOCKER_DEFAULT_PLATFORM=linux/amd64
FROM --platform=${DOCKER_DEFAULT_PLATFORM} eclipse-temurin:17-jre-jammy
VOLUME /tmp
ARG JAR_FILE=build/libs/*.jar
COPY ${JAR_FILE} app.jar
ENTRYPOINT ["java","-jar","/app.jar"]