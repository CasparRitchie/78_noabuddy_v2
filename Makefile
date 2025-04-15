# Start the Vite frontend dev server
frontend:
	cd frontend && npm run dev

# Start the FastAPI backend server with autoreload
backend:
	cd backend && uvicorn main:app --reload

# Build the frontend with Vite
build:
	cd frontend && npm run build

# Clean the frontend build output (optional)
clean:
	rm -rf frontend/dist

# Start both frontend and backend in separate Terminal tabs (macOS only)
start-all:
	@echo "Starting frontend and backend..."
	osascript -e 'tell app "Terminal" to do script "cd \"$$PWD/frontend\" && npm run dev"'
	osascript -e 'tell app "Terminal" to do script "cd \"$$PWD/backend\" && uvicorn main:app --reload"'

