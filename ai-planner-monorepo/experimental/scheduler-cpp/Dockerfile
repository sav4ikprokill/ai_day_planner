FROM alpine:latest AS builder
WORKDIR /app

RUN apk add --no-cache build-base cmake

COPY CMakeLists.txt .
COPY src ./src

RUN cmake -S . -B build
RUN cmake --build build --config Release

FROM alpine:latest
WORKDIR /app

RUN apk add --no-cache libstdc++

COPY --from=builder /app/build/scheduler /app/scheduler

EXPOSE 8080

CMD ["/app/scheduler"]
