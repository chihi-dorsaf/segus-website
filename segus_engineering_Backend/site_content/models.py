from django.db import models


class SiteContent(models.Model):
    content_type = models.CharField(
        max_length=20, choices=(("TEXT", "Texte"), ("IMAGE", "Image")), default="TEXT"
    )
    title = models.CharField(max_length=100)
    content = models.TextField()  # Texte ou chemin de l'image

    def __str__(self):
        return self.title
