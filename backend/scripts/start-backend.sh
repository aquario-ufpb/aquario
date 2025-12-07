#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
DO_RESET=false
DO_SEED=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --reset)
            DO_RESET=true
            shift
            ;;
        --seed)
            DO_SEED=true
            shift
            ;;
        -h|--help)
            echo -e "${BLUE}🌊 Aquário Backend Startup Script${NC}"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --reset    Reset all database data (will ask for confirmation)"
            echo "  --seed     Seed the database with example data"
            echo "  -h, --help Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0              # Start backend normally"
            echo "  $0 --seed       # Start backend and seed database"
            echo "  $0 --reset      # Reset database, then start backend"
            echo "  $0 --reset --seed  # Reset database, seed it, then start"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 Starting Aquário Backend...${NC}"

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running!${NC}"
        echo -e "${YELLOW}📦 Starting Docker Desktop...${NC}"
        
        # Try to start Docker Desktop (macOS)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open -a Docker
            echo -e "${YELLOW}⏳ Waiting for Docker to start (this may take a moment)...${NC}"
            
            # Wait for Docker to start (max 60 seconds)
            for i in {1..60}; do
                if docker info > /dev/null 2>&1; then
                    echo -e "${GREEN}✅ Docker is now running!${NC}"
                    return 0
                fi
                sleep 1
                echo -n "."
            done
            
            echo -e "${RED}❌ Docker failed to start within 60 seconds. Please start Docker Desktop manually.${NC}"
            exit 1
        else
            echo -e "${RED}❌ Please start Docker manually and run this script again.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Docker is already running!${NC}"
    fi
}

# Function to check if database is running
check_database() {
    echo -e "${BLUE}🔍 Checking database status...${NC}"
    
    if docker ps | grep -q "postgres"; then
        echo -e "${GREEN}✅ PostgreSQL container is running!${NC}"
    else
        echo -e "${YELLOW}📦 Starting PostgreSQL database...${NC}"
        cd "$(dirname "$0")/backend"
        docker-compose up -d
        
        # Wait for database to be ready
        echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
        for i in {1..30}; do
            if docker exec $(docker ps -q --filter "name=postgres") pg_isready -U postgres > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Database is ready!${NC}"
                break
            fi
            sleep 1
            echo -n "."
        done
    fi
}

# Function to reset the database
reset_database() {
    echo -e "${RED}⚠️  WARNING: This will delete ALL data in the database!${NC}"
    echo -e "${YELLOW}This action cannot be undone.${NC}"
    echo ""
    read -p "Are you sure you want to reset the database? (y/N): " confirm
    
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🗑️  Resetting database...${NC}"
        npx prisma migrate reset --force --skip-seed
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Database reset successfully!${NC}"
        else
            echo -e "${RED}❌ Database reset failed!${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Reset cancelled.${NC}"
    fi
}

# Function to run database migrations
run_migrations() {
    echo -e "${BLUE}🔄 Running database migrations...${NC}"
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}📝 Creating .env file...${NC}"
        echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/aquario?schema=public"' > .env
    fi
    
    # Run migrations
    npm run db:migrate:deploy
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migrations completed successfully!${NC}"
    else
        echo -e "${RED}❌ Migration failed!${NC}"
        exit 1
    fi
}

# Function to generate Prisma client
generate_client() {
    echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
    npm run db:generate
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Prisma client generated successfully!${NC}"
    else
        echo -e "${RED}❌ Prisma client generation failed!${NC}"
        exit 1
    fi
}

# Function to seed database with example data
seed_database() {
    echo -e "${BLUE}🌱 Seeding database with example data...${NC}"
    npm run db:seed
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database seeded successfully!${NC}"
        echo -e "${YELLOW}📊 Example data includes:${NC}"
        echo -e "   • Campus and Centers"
        echo -e "   • Courses (Ciência da Computação, etc.)"
        echo -e "   • Users (Thais, Itamar, Tadea, etc.)"
        echo -e "   • Entities (ARIA, TAIL)"
        echo -e "   • Example Guides with sections and subsections"
    else
        echo -e "${RED}❌ Database seeding failed!${NC}"
        exit 1
    fi
}

# Function to start the backend server
start_backend() {
    echo -e "${BLUE}🚀 Starting backend server...${NC}"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        npm install
    fi
    
    echo -e "${GREEN}🎉 Backend is starting on http://localhost:3001${NC}"
    echo -e "${BLUE}📚 API Documentation:${NC}"
    echo -e "   • Guides API: http://localhost:3001/guias"
    echo -e "   • Search API: http://localhost:3001/search"
    echo -e "   • Auth API: http://localhost:3001/auth"
    echo -e "   • Projects API: http://localhost:3001/projetos"
    echo -e "   • Jobs API: http://localhost:3001/vagas"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    echo ""
    
    npm run dev
}

# Main execution
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    🌊 Aquário Backend Startup Script    ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # Check if we're in the backend directory
    if [ ! -f "package.json" ] || [ ! -d "prisma" ]; then
        echo -e "${RED}❌ Please run this script from the backend directory${NC}"
        echo -e "${YELLOW}Expected structure:${NC}"
        echo -e "   backend/"
        echo -e "   ├── package.json"
        echo -e "   ├── prisma/"
        echo -e "   └── scripts/start-backend.sh"
        exit 1
    fi
    
    # Run all checks and setup
    check_docker
    check_database
    
    # Handle --reset flag
    if [ "$DO_RESET" = true ]; then
        reset_database
    fi
    
    run_migrations
    generate_client
    
    # Handle --seed flag
    if [ "$DO_SEED" = true ]; then
        seed_database
    fi
    
    start_backend
}

# Run main function
main
