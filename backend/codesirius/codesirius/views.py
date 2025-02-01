from rest_framework.exceptions import NotFound
from rest_framework.views import APIView


class Fallback404View(APIView):
    def get(self, request, *args, **kwargs):
        raise NotFound("Resource not found")
