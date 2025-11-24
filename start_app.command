#!/bin/bash
cd "$(dirname "$0")"
open http://localhost:8000
ruby -run -e httpd . -p 8000
