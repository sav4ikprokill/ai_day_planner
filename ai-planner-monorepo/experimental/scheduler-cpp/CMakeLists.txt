cmake_minimum_required(VERSION 3.20)
project(scheduler_cpp LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

include(FetchContent)

FetchContent_Declare(
  cpp_httplib
  URL https://raw.githubusercontent.com/yhirose/cpp-httplib/v0.16.3/httplib.h
  DOWNLOAD_NO_EXTRACT TRUE
)

FetchContent_Declare(
  nlohmann_json_single
  URL https://raw.githubusercontent.com/nlohmann/json/v3.11.3/single_include/nlohmann/json.hpp
  DOWNLOAD_NO_EXTRACT TRUE
)

FetchContent_MakeAvailable(cpp_httplib nlohmann_json_single)

get_filename_component(CPP_HTTPLIB_DIR "${cpp_httplib_SOURCE_DIR}" DIRECTORY)
get_filename_component(NLOHMANN_JSON_DIR "${nlohmann_json_single_SOURCE_DIR}" DIRECTORY)

add_executable(scheduler
  src/main.cpp
)

target_include_directories(scheduler PRIVATE
  "${CPP_HTTPLIB_DIR}"
  "${NLOHMANN_JSON_DIR}"
)

if(MSVC)
  target_compile_options(scheduler PRIVATE /W4)
else()
  target_compile_options(scheduler PRIVATE -Wall -Wextra -Wpedantic)
endif()
