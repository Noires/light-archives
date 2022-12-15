<template>
  <section class="page-edit-article">
    <template v-if="loaded">
      <h2>{{ article.id ? 'Artikel bearbeiten' : 'Neuen Artikel erstellen' }}</h2>
      <q-form ref="form" @submit="onSubmit">
        <section v-if="!preview" class="page-edit-article__form-controls">
          <label>
            <template v-if="article.status === NewsStatus.SUBMITTED">Submitted for publication</template>
            <template v-else-if="article.status === NewsStatus.PUBLISHED"
              >Veröffentlicht am {{ $display.formatDateEorzean(article.publishedAt) }}</template
            >
            <template v-else>ENTWURF</template>
          </label>
          <q-input v-model="article.title" label="Titel *" :rules="[$rules.required('Dieses Feld ist erforderlich.')]" />
          <q-input v-model="article.subtitle" label="Untertitel" />
          <template v-if="article.id && $store.getters.character?.newsRole === NewsRole.EDITOR">
            <div class="page-edit-article__thumb-choice">Elpisgarten Thumbnail: <q-btn label="Wähle..." @click="onSelectThumbnail" /></div>
            <section v-if="image">
              <q-img class="page-edit-article__image" :src="image.url" :initial-ratio="750 / 422" loading="eager" />
            </section>
          </template>
          <h6>Summary *</h6>
          <div class="text-caption">
            Eine kurze Zusammenfassung, worum sich der Aritkel dreht. Sie wird nicht auf der NEWSPAPER Seite angezeigt, dafür jedoch auf der
            Hauptseite von Elpisgarten.
          </div>
          <q-input
            class="page-edit-article__summary"
            type="textarea"
            outlined
            v-model="article.summary"
            :rules="[$rules.required('This field is required.')]"
          />
          <h6>Content *</h6>
          <html-editor v-model="article.content" />
        </section>
        <section v-else class="page-edit-article__preview">
          <article-view :article="article" :preview="true" />
        </section>
        <div class="page-edit-article__button-bar page-edit-article__form-controls">
          <q-btn-toggle v-model="preview" :options="previewOptions" toggle-color="secondary" />
          <div class="page-edit-article__revert-submit">
            <q-btn label="Zurücksetzen" color="secondary" @click="revert" />&nbsp;
            <template v-if="article.status === NewsStatus.DRAFT">
              <q-btn label="Entwurf speichern" color="primary" @click="saveDraft" />&nbsp;
              <q-btn label="Für Veröffentlichung einreichen" color="negative" @click="submitForPublication" />
            </template>
            <template v-else>
              <q-btn label="Änderungen speichern" type="submit" color="primary" />
              <template
                v-if="article.status === NewsStatus.SUBMITTED && $store.getters.character?.newsRole === NewsRole.EDITOR"
                >&nbsp;
                <q-btn label="Veröffentlichen" color="negative" @click="publish" />
              </template>
            </template>
          </div>
        </div>
        <q-inner-loading :showing="saving" />
      </q-form>
    </template>
    <q-spinner v-else />

    <q-dialog v-model="confirmRevert" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <span class="q-ml-sm">Do you want to revert your unsaved changes to the last saved version?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Bearbeitung fortsetzen" color="secondary" v-close-popup />
          <q-btn flat label="Zurücksetzen" color="negative" v-close-popup @click="onConfirmRevert" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </section>
</template>

<script lang="ts">
import { NewsArticleDto } from '@app/shared/dto/news/news-article.dto';
import HtmlEditor from 'components/common/HtmlEditor.vue';
import ArticleView from 'components/article/ArticleView.vue';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import { NewsStatus } from '@app/shared/enums/news-status.enum';
import { QForm } from 'quasar';
import { NewsRole } from '@app/shared/enums/news-role.enum';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';

@Options({
  name: 'PageEditArticle',
  components: {
    HtmlEditor,
    ArticleView,
  },
  beforeRouteEnter(to, _, next) {
    next((vm) => (vm as PageEditArticle).load(to.params));
  },
  async beforeRouteUpdate(to) {
    await (this as PageEditArticle).load(to.params);
  },
})
export default class PageEditArticle extends Vue {
  readonly NewsStatus = NewsStatus;
  readonly NewsRole = NewsRole;

  readonly previewOptions = [
    { label: 'Bearbeitung', value: false },
    { label: 'Vorschau', value: true },
  ];

  article = new NewsArticleDto();
  articleBackup = new NewsArticleDto();

  image: ImageSummaryDto | null = null;

  preview = false;
  loaded = false;
  saving = false;
  submittingForPublication = false;
  publishing = false;

  confirmRevert = false;

  private async load(params: RouteParams) {
    const id = parseInt(params.id as string, 10);
    const character = this.$store.getters.character;

    if (!character) {
      void this.$router.push('/');
      return;
    }

    if (id) {
      this.loaded = false;
      this.articleBackup = await this.$api.news.getArticleById(id);
      this.loaded = true;
    } else {
      this.articleBackup = new NewsArticleDto({
        canEdit: true,
        canDelete: true,
        status: NewsStatus.DRAFT,
        publishedAt: null as unknown as number,
        title: '',
        subtitle: '',
        summary: '',
        content: '',
        slug: '',
        category: '',
        imageId: null,
        author: {
          name: character.name,
          server: character.server,
          pseudonym: character.newsPseudonym || character.name,
        },
      });
      this.loaded = true;
    }

    this.article = new NewsArticleDto(this.articleBackup);

    if (this.article.imageId) {
      this.image = (await this.$api.news.getArticleImages(this.article.id!))
        .find(image => image.id === this.article.imageId) || null;
    }
  }

  revert() {
    this.confirmRevert = true;
  }

  onConfirmRevert() {
    this.article = new NewsArticleDto(this.articleBackup);
  }

  saveDraft() {
    this.submittingForPublication = false;
    (this.$refs.form as QForm).submit();
  }

  async submitForPublication() {
    const form = this.$refs.form as QForm;

    if (!(await form.validate())) {
      return;
    }

    this.$q
      .dialog({
        title: 'Zur Veröffentlichung einreichen',
        message:
          "Du bist fast fertig! Wenn du glaubst das dein Artikel bereit ist, kannst du diesen für die Veröffentlichung einreichen. Ein NEWSPAPER Editor wird alles überprüfen und den Artikel im Anschluss in die nächsten Ausgabe aufnehmen.",
        ok: {
          label: 'Einreichen',
          color: 'primary',
          flat: true,
        },
        cancel: {
          label: 'Abbrechen',
          color: 'secondary',
          flat: true,
        },
      })
      .onOk(() => {
        this.submittingForPublication = true;
        form.submit();
      });
  }

  async publish() {
    const form = this.$refs.form as QForm;

    if (!(await form.validate())) {
      return;
    }

    this.$q
      .dialog({
        title: 'Veröffentlichung',
        message: 'Bist du dir sicher das dieser Artikel veröffentlicht werden soll?',
        ok: {
          label: 'Veröffentlichen',
          color: 'primary',
          flat: true,
        },
        cancel: {
          label: 'Abbrechen',
          color: 'secondary',
          flat: true,
        },
      })
      .onOk(() => {
        this.publishing = true;
        form.submit();
      });
  }

  async onSubmit() {
    this.saving = true;

    try {
      const savedArticle = new NewsArticleDto(this.article);

      if (this.submittingForPublication && this.article.status === NewsStatus.DRAFT) {
        savedArticle.status = NewsStatus.SUBMITTED;
      } else if (this.publishing && this.article.status === NewsStatus.SUBMITTED) {
        savedArticle.status = NewsStatus.PUBLISHED;
      }

      if (!this.article.id) {
        this.article = new NewsArticleDto(await this.$api.news.createArticle(savedArticle));
        void this.$router.replace(`/edit-article/${this.article.id!}`);
      } else {
        this.article = new NewsArticleDto(await this.$api.news.editArticle(savedArticle));
      }

      this.articleBackup = new NewsArticleDto(this.article);

      notifySuccess(
        'Artikel gespeichert.' /*, {
        label: 'Anschauen',
        color: 'white',
        //handler: () => this.viewArticle(),
      } */
      );
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
    }
  }

  async onSelectThumbnail() {
    const thumbnails = await this.$api.news.getArticleImages(this.article.id!);

    if (!thumbnails.length) {
      notifyError('Keine Bilder im Artikel gefunden.');
      return;
    }

    const GalleryDialog = (await import('components/common/GalleryDialog.vue')).default;

    this.$q
      .dialog({
        component: GalleryDialog,
        componentProps: {
          images: thumbnails,
        },
      })
      .onOk((image: ImageSummaryDto) => {
        this.article.imageId = image.id;
        this.image = image;
      });
  }
}
</script>

<style lang="scss">
.page-edit-article__form-controls {
  max-width: 900px;
  margin: auto;
}

.page-edit-article__summary .q-field__inner {
  background: white;
}

.page-edit-article__preview {
  margin-bottom: 24px;
}

.page-edit-article__button-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 16px;
}

.page-edit-article__preview h6 {
  font-family: $header-font;
}

.page-edit-article__type-label {
  margin-top: 12px;
}

.page-edit-article .article__content {
  columns: 2;
}

.page-edit-article__thumb-choice {
  margin-top: 12px;
  display: flex;
  align-items: center;
}

.page-edit-article__thumb-choice .q-btn {
  margin-left: 12px;
}

.page-edit-article__image {
  max-width: 250px;
  min-width: 175px;
}
</style>
