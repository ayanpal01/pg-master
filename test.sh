#!/bin/bash

echo "🔍 Testing PG Master Application..."
echo ""

# Check if backend is running
echo "📡 Checking backend..."
BACKEND_RESPONSE=$(curl -s http://localhost:4000/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Backend is running on http://localhost:4000"
    echo "   Response: $BACKEND_RESPONSE"
else
    echo "❌ Backend is NOT running on http://localhost:4000"
    echo "   Start it with: cd backend && npm run dev"
    exit 1
fi

echo ""
echo "🌐 Checking frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$FRONTEND_RESPONSE" == "200" ] || [ "$FRONTEND_RESPONSE" == "301" ] || [ "$FRONTEND_RESPONSE" == "302" ]; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "❌ Frontend is NOT running on http://localhost:3000"
    echo "   Start it with: cd frontend && npm run dev"
    exit 1
fi

echo ""
echo "🔐 Checking environment variables..."

# Check backend .env
if [ -f "backend/.env" ]; then
    echo "✅ backend/.env exists"
    
    if grep -q "MONGODB_URI=" backend/.env; then
        echo "  ✅ MONGODB_URI is set"
    else
        echo "  ❌ MONGODB_URI is missing"
    fi
    
    if grep -q "JWT_SECRET=" backend/.env; then
        echo "  ✅ JWT_SECRET is set"
    else
        echo "  ❌ JWT_SECRET is missing"
    fi
    
    if grep -q "FRONTEND_URL=" backend/.env; then
        echo "  ✅ FRONTEND_URL is set"
    else
        echo "  ❌ FRONTEND_URL is missing"
    fi
else
    echo "❌ backend/.env does not exist"
    echo "   Create it from: cp backend/.env.example backend/.env"
fi

# Check frontend .env.local
if [ -f "frontend/.env.local" ]; then
    echo "✅ frontend/.env.local exists"
    
    if grep -q "NEXT_PUBLIC_BACKEND_URL=" frontend/.env.local; then
        echo "  ✅ NEXT_PUBLIC_BACKEND_URL is set"
    else
        echo "  ❌ NEXT_PUBLIC_BACKEND_URL is missing"
    fi
else
    echo "❌ frontend/.env.local does not exist"
    echo "   Create it from: cp frontend/.env.example frontend/.env.local"
fi

echo ""
echo "🎯 Test Summary:"
echo "=================="
echo "Backend:  $([ $? -eq 0 ] && echo '✅ Ready' || echo '❌ Not Ready')"
echo "Frontend: $([ "$FRONTEND_RESPONSE" == "200" ] && echo '✅ Ready' || echo '❌ Not Ready')"
echo ""
echo "📖 Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Try logging in or creating a new PG"
echo "3. Test the sidebar navigation"
echo "4. Check browser console for any errors"
echo ""
echo "📚 Documentation:"
echo "- Quick fixes: FIXES.md"
echo "- Security:    SECURITY.md"
echo "- Setup:       README.md"
echo ""
