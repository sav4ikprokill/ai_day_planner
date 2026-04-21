#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

#include "httplib.h"
#include "nlohmann/json.hpp"

using json = nlohmann::json;

namespace {

struct TaskItem {
    json raw;
    int priority;
    long long id;
    std::size_t original_index;
};

std::vector<TaskItem> parse_tasks(const json& payload) {
    if (!payload.is_array()) {
        throw std::invalid_argument("Request body must be a JSON array");
    }

    std::vector<TaskItem> tasks;
    tasks.reserve(payload.size());

    for (std::size_t index = 0; index < payload.size(); ++index) {
        const auto& task = payload.at(index);

        if (!task.is_object()) {
            throw std::invalid_argument("Each task must be a JSON object");
        }

        const int priority = task.value("priority", 0);
        const long long id = task.value("id", static_cast<long long>(index));

        tasks.push_back(TaskItem{
            task,
            priority,
            id,
            index,
        });
    }

    return tasks;
}

json optimize_tasks(const json& payload) {
    auto tasks = parse_tasks(payload);

    std::sort(tasks.begin(), tasks.end(), [](const TaskItem& left, const TaskItem& right) {
        if (left.priority != right.priority) {
            return left.priority > right.priority;
        }

        if (left.id != right.id) {
            return left.id < right.id;
        }

        return left.original_index < right.original_index;
    });

    json response = json::array();
    for (const auto& task : tasks) {
        response.push_back(task.raw);
    }

    return response;
}

}  // namespace

int main() {
    httplib::Server server;

    server.Post("/optimize", [](const httplib::Request& request, httplib::Response& response) {
        try {
            const auto payload = json::parse(request.body);
            const auto optimized = optimize_tasks(payload);

            response.set_content(optimized.dump(), "application/json");
            response.status = 200;
        } catch (const std::exception& error) {
            json error_response = {
                {"error", error.what()},
            };
            response.set_content(error_response.dump(), "application/json");
            response.status = 400;
        }
    });

    std::cout << "scheduler-cpp listening on 0.0.0.0:8080" << std::endl;
    server.listen("0.0.0.0", 8080);
    return 0;
}
