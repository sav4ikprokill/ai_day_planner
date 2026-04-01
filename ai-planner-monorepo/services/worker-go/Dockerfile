FROM golang:1.22-alpine AS builder

WORKDIR /src

COPY go.mod ./
COPY main.go ./
RUN go mod tidy

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o worker main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /src/worker /usr/local/bin/worker

ENTRYPOINT ["/usr/local/bin/worker"]
