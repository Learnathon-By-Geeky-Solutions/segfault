from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView


@require_http_methods(["GET"])
def health_check(request):
    return Response({"status": "ok"})


class Fallback404View(APIView):
    def get(self, request, *args, **kwargs):
        raise NotFound("Resource not found")
