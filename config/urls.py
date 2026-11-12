"""config/urls.py — Root URL configuration."""
from apps.accounts.webhooks import ClerkWebhookView
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from apps.accounts.views import HomePageView

from apps.accounts.api import MeView


urlpatterns = [
    path("", HomePageView.as_view(), name="home"),
    path("admin/", admin.site.urls),
    path("accounts/", include("apps.accounts.urls", namespace="accounts")),
    path("api/webhooks/clerk/", ClerkWebhookView.as_view(), name="clerk-webhook"),
    path("api/me/", MeView.as_view()),
    path("api/", include("apps.exams.urls", namespace="exams")),
]

# Serve media files through Django in development only.
# In production, media is served directly from S3 — this block is inactive.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG and "debug_toolbar" in settings.INSTALLED_APPS:
    import debug_toolbar

    urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns

