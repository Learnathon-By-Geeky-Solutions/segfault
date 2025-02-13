from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework.exceptions import NotFound
from rest_framework.views import APIView


@require_http_methods(["GET"])
def health_check(request):
    return JsonResponse({"status": "ok"})


class Fallback404View(APIView):
    def get(self, request, *args, **kwargs):
        raise NotFound("Resource not found")
