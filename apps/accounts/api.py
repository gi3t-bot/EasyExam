from rest_framework.response import Response
from rest_framework.views import APIView


class MeView(APIView):
    def get(self, request):
        u = request.user
        return Response({"id": u.id, "clerk_id": u.clerk_id, "email": u.email})