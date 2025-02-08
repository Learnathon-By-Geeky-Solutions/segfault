from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView


def health_check(request):
    if request.method == "GET":
        return Response({"status": "ok"})
    return Response(status=405)


class Fallback404View(APIView):
    def get(self, request, *args, **kwargs):
        raise NotFound("Resource not found")
