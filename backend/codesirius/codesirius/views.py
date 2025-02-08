from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView


@api_view(["GET"])
# Restricted to GET requests only.
# Health check endpoint.
# Safe because it only returns a status and has no side effects.
def health_check(request):
    return Response({"status": "ok"})


class Fallback404View(APIView):
    def get(self, request, *args, **kwargs):
        raise NotFound("Resource not found")
