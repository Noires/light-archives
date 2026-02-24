<template>
  <div class="offerings-editor">
    <!-- Top-level categories -->
    <draggable
      v-model="localCategories"
      handle=".drag-handle"
      item-key="__key"
      animation="150"
      @end="onReorder"
    >
      <template #item="{ element: cat, index: catIdx }">
        <div class="offerings-editor__category-block">
          <div class="offerings-editor__category-header">
            <span class="drag-handle offerings-editor__drag-handle">⠿</span>
            <template v-if="cat.__editing">
              <q-input
                v-model="cat.name"
                dense
                autofocus
                class="offerings-editor__name-input"
                @keyup.enter="cat.__editing = false"
                @blur="cat.__editing = false"
              />
            </template>
            <template v-else>
              <span class="offerings-editor__category-name" @click="cat.__editing = true">{{ cat.name || '(Ohne Name)' }}</span>
            </template>
            <div class="offerings-editor__category-actions">
              <q-btn flat dense round icon="edit" size="sm" @click="cat.__editing = true" />
              <q-btn flat dense round icon="delete" size="sm" color="negative" @click="removeCategory(catIdx)" />
            </div>
          </div>

          <!-- Subcategories within this category -->
          <div class="offerings-editor__subcategories">
            <draggable
              v-model="cat.subcategories"
              handle=".drag-handle"
              item-key="__key"
              animation="150"
              @end="onReorder"
            >
              <template #item="{ element: sub, index: subIdx }">
                <div class="offerings-editor__subcategory-block">
                  <div class="offerings-editor__subcategory-header">
                    <span class="drag-handle offerings-editor__drag-handle">⠿</span>
                    <template v-if="sub.__editing">
                      <q-input
                        v-model="sub.name"
                        dense
                        autofocus
                        class="offerings-editor__name-input"
                        @keyup.enter="sub.__editing = false"
                        @blur="sub.__editing = false"
                      />
                    </template>
                    <template v-else>
                      <span class="offerings-editor__subcategory-name" @click="sub.__editing = true">{{ sub.name || '(Ohne Name)' }}</span>
                    </template>
                    <div class="offerings-editor__category-actions">
                      <q-btn flat dense round icon="edit" size="sm" @click="sub.__editing = true" />
                      <q-btn flat dense round icon="delete" size="sm" color="negative" @click="removeSubcategory(catIdx, subIdx)" />
                    </div>
                  </div>

                  <!-- Offerings within this subcategory -->
                  <draggable
                    v-model="sub.offerings"
                    :group="{ name: 'offerings' }"
                    handle=".drag-handle"
                    item-key="__key"
                    animation="150"
                    @end="onReorder"
                  >
                    <template #item="{ element: off, index: offIdx }">
                      <div class="offerings-editor__offering-item">
                        <span class="drag-handle offerings-editor__drag-handle">⠿</span>
                        <template v-if="off.__expanded">
                          <div class="offerings-editor__offering-form">
                            <q-input v-model="off.name" label="Name *" dense />
                            <q-input v-model="off.price" label="Preis" dense placeholder="z.B. 5 Gil" />
                            <q-input v-model="off.description" label="Beschreibung" dense type="textarea" rows="2" autogrow />
                            <div class="offerings-editor__offering-image">
                              <template v-if="off.imageUrl">
                                <img :src="off.imageUrl" class="offerings-editor__offering-thumb" alt="Bild" />
                                <q-btn flat dense icon="delete" color="negative" size="sm" @click="removeOfferingImage(off)" :loading="off.__imageLoading" />
                              </template>
                              <template v-else>
                                <q-btn
                                  flat
                                  dense
                                  icon="photo_camera"
                                  label="Bild hochladen"
                                  size="sm"
                                  @click="triggerImageUpload(off)"
                                  :loading="off.__imageLoading"
                                />
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png"
                                  class="offerings-editor__file-input"
                                  :ref="(el) => setFileRef(off.__key, el)"
                                  @change="(e) => onImageFileSelected(e, off)"
                                />
                              </template>
                            </div>
                            <div class="offerings-editor__offering-form-actions">
                              <q-btn flat dense label="Fertig" color="primary" size="sm" @click="off.__expanded = false" />
                            </div>
                          </div>
                        </template>
                        <template v-else>
                          <span class="offerings-editor__offering-name">{{ off.name || '(Ohne Name)' }}</span>
                          <span v-if="off.price" class="offerings-editor__offering-price">{{ off.price }}</span>
                        </template>
                        <div class="offerings-editor__offering-actions">
                          <q-btn flat dense round icon="edit" size="xs" @click="off.__expanded = !off.__expanded" />
                          <q-btn flat dense round icon="delete" size="xs" color="negative" @click="removeOffering(sub.offerings, offIdx, off)" />
                        </div>
                      </div>
                    </template>
                  </draggable>

                  <q-btn
                    flat
                    dense
                    icon="add"
                    label="Angebot hinzufügen"
                    size="sm"
                    class="offerings-editor__add-btn"
                    @click="addOffering(sub.offerings)"
                  />
                </div>
              </template>
            </draggable>

            <q-btn
              flat
              dense
              icon="create_new_folder"
              label="Unterkategorie hinzufügen"
              size="sm"
              class="offerings-editor__add-btn"
              @click="addSubcategory(cat)"
            />
          </div>

          <!-- Direct offerings in this category (no subcategory) -->
          <div v-if="cat.offerings && cat.offerings.length > 0 || !cat.subcategories || cat.subcategories.length === 0" class="offerings-editor__direct-offerings">
            <draggable
              v-model="cat.offerings"
              :group="{ name: 'offerings' }"
              handle=".drag-handle"
              item-key="__key"
              animation="150"
              @end="onReorder"
            >
              <template #item="{ element: off, index: offIdx }">
                <div class="offerings-editor__offering-item">
                  <span class="drag-handle offerings-editor__drag-handle">⠿</span>
                  <template v-if="off.__expanded">
                    <div class="offerings-editor__offering-form">
                      <q-input v-model="off.name" label="Name *" dense />
                      <q-input v-model="off.price" label="Preis" dense placeholder="z.B. 5 Gil" />
                      <q-input v-model="off.description" label="Beschreibung" dense type="textarea" rows="2" autogrow />
                      <div class="offerings-editor__offering-image">
                        <template v-if="off.imageUrl">
                          <img :src="off.imageUrl" class="offerings-editor__offering-thumb" alt="Bild" />
                          <q-btn flat dense icon="delete" color="negative" size="sm" @click="removeOfferingImage(off)" :loading="off.__imageLoading" />
                        </template>
                        <template v-else>
                          <q-btn
                            flat
                            dense
                            icon="photo_camera"
                            label="Bild hochladen"
                            size="sm"
                            @click="triggerImageUpload(off)"
                            :loading="off.__imageLoading"
                          />
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            class="offerings-editor__file-input"
                            :ref="(el) => setFileRef(off.__key, el)"
                            @change="(e) => onImageFileSelected(e, off)"
                          />
                        </template>
                      </div>
                      <div class="offerings-editor__offering-form-actions">
                        <q-btn flat dense label="Fertig" color="primary" size="sm" @click="off.__expanded = false" />
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <span class="offerings-editor__offering-name">{{ off.name || '(Ohne Name)' }}</span>
                    <span v-if="off.price" class="offerings-editor__offering-price">{{ off.price }}</span>
                  </template>
                  <div class="offerings-editor__offering-actions">
                    <q-btn flat dense round icon="edit" size="xs" @click="off.__expanded = !off.__expanded" />
                    <q-btn flat dense round icon="delete" size="xs" color="negative" @click="removeOffering(cat.offerings!, offIdx, off)" />
                  </div>
                </div>
              </template>
            </draggable>
            <q-btn
              flat
              dense
              icon="add"
              label="Angebot direkt hinzufügen"
              size="sm"
              class="offerings-editor__add-btn"
              @click="addOffering(cat.offerings!)"
            />
          </div>
        </div>
      </template>
    </draggable>

    <q-btn
      flat
      icon="add"
      label="Oberkategorie hinzufügen"
      color="primary"
      class="offerings-editor__add-top-btn"
      @click="addCategory"
    />

    <!-- Confirm delete dialog -->
    <q-dialog v-model="confirmDelete.show" persistent>
      <q-card>
        <q-card-section>
          <span>{{ confirmDelete.message }}</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" color="secondary" v-close-popup />
          <q-btn flat label="Löschen" color="negative" v-close-popup @click="confirmDelete.onConfirm()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { VenueOfferingCategoryDto, VenueOfferingDto, VenueOfferingsDto } from '@app/shared/dto/venues/venue-offering.dto';
import { notifyError } from 'src/common/notify';
import { defineComponent, ref, watch } from 'vue';
import draggable from 'vuedraggable';
import { useApi } from 'src/boot/axios';

// Internal type augmenting DTO with editor state
interface EditorOffering extends VenueOfferingDto {
  __key: string;
  __expanded: boolean;
  __imageLoading: boolean;
}

interface EditorCategory extends VenueOfferingCategoryDto {
  __key: string;
  __editing: boolean;
  subcategories: EditorCategory[];
  offerings: EditorOffering[];
}

let keyCounter = 0;
function makeKey(): string {
  return `k_${++keyCounter}`;
}

function makeOffering(partial?: Partial<VenueOfferingDto>): EditorOffering {
  return {
    name: '',
    sortOrder: 0,
    description: '',
    price: '',
    ...partial,
    __key: makeKey(),
    __expanded: true,
    __imageLoading: false,
  };
}

function makeCategory(partial?: Partial<VenueOfferingCategoryDto>): EditorCategory {
  return {
    name: '',
    sortOrder: 0,
    subcategories: [],
    offerings: [],
    ...partial,
    __key: makeKey(),
    __editing: !partial?.name,
  } as EditorCategory;
}

function toEditorCategory(cat: VenueOfferingCategoryDto): EditorCategory {
  return makeCategory({
    ...cat,
    subcategories: (cat.subcategories || []).map((sub) =>
      makeCategory({
        ...sub,
        subcategories: [],
        offerings: (sub.offerings || []).map((o) => makeOffering(o)),
      }),
    ),
    offerings: (cat.offerings || []).map((o) => makeOffering(o)),
  });
}

function toDto(cats: EditorCategory[]): VenueOfferingsDto {
  return {
    categories: cats.map((cat, i) => ({
      id: cat.id,
      name: cat.name,
      sortOrder: i,
      subcategories: (cat.subcategories || []).map((sub, j) => ({
        id: sub.id,
        name: sub.name,
        sortOrder: j,
        subcategories: [],
        offerings: (sub.offerings || []).map((off, k) => toOfferingDto(off, k)),
      })),
      offerings: (cat.offerings || []).map((off, k) => toOfferingDto(off, k)),
    })),
  };
}

function toOfferingDto(off: EditorOffering, sortOrder: number): VenueOfferingDto {
  return {
    id: off.id,
    name: off.name,
    description: off.description || '',
    price: off.price || '',
    imageId: off.imageId,
    imageUrl: off.imageUrl,
    sortOrder,
  };
}

const $api = useApi();

export default defineComponent({
  name: 'VenueOfferingsEditor',
  components: { draggable },
  props: {
    modelValue: {
      type: Object as () => VenueOfferingsDto,
      required: true,
    },
    venueId: {
      type: Number,
      required: true,
    },
    characterId: {
      type: Number,
      default: null,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const localCategories = ref<EditorCategory[]>([]);
    const fileRefs = new Map<string, HTMLInputElement>();

    const confirmDelete = ref<{
      show: boolean;
      message: string;
      onConfirm: () => void;
    }>({
      show: false,
      message: '',
      onConfirm: () => undefined,
    });

    // Sync incoming modelValue → editor state
    watch(
      () => props.modelValue,
      (val) => {
        if (val) {
          localCategories.value = (val.categories || []).map(toEditorCategory);
        }
      },
      { immediate: true, deep: false },
    );

    function emitUpdate() {
      emit('update:modelValue', toDto(localCategories.value));
    }

    function onReorder() {
      emitUpdate();
    }

    function addCategory() {
      localCategories.value.push(makeCategory());
      emitUpdate();
    }

    function removeCategory(idx: number) {
      const cat = localCategories.value[idx];
      const hasContent =
        (cat.subcategories && cat.subcategories.length > 0) ||
        (cat.offerings && cat.offerings.length > 0);

      if (hasContent) {
        confirmDelete.value = {
          show: true,
          message: `Kategorie "${cat.name}" und alle Inhalte löschen?`,
          onConfirm: () => {
            localCategories.value.splice(idx, 1);
            emitUpdate();
          },
        };
      } else {
        localCategories.value.splice(idx, 1);
        emitUpdate();
      }
    }

    function addSubcategory(cat: EditorCategory) {
      if (!cat.subcategories) cat.subcategories = [];
      cat.subcategories.push(makeCategory());
      emitUpdate();
    }

    function removeSubcategory(catIdx: number, subIdx: number) {
      const sub = localCategories.value[catIdx].subcategories[subIdx];
      const hasContent = sub.offerings && sub.offerings.length > 0;

      if (hasContent) {
        confirmDelete.value = {
          show: true,
          message: `Unterkategorie "${sub.name}" und alle Angebote darin löschen?`,
          onConfirm: () => {
            localCategories.value[catIdx].subcategories.splice(subIdx, 1);
            emitUpdate();
          },
        };
      } else {
        localCategories.value[catIdx].subcategories.splice(subIdx, 1);
        emitUpdate();
      }
    }

    function addOffering(list: EditorOffering[]) {
      list.push(makeOffering());
      emitUpdate();
    }

    function removeOffering(list: EditorOffering[], idx: number, off: EditorOffering) {
      list.splice(idx, 1);
      // If the offering had an uploaded image, delete it from server immediately
      if (off.imageId && props.venueId) {
        $api.venues.deleteOfferingImage(props.venueId, off.imageId).catch(() => undefined);
      }
      emitUpdate();
    }

    function setFileRef(key: string, el: unknown) {
      if (el instanceof HTMLInputElement) {
        fileRefs.set(key, el);
      } else {
        fileRefs.delete(key);
      }
    }

    function triggerImageUpload(off: EditorOffering) {
      const input = fileRefs.get(off.__key);
      if (input) input.click();
    }

    async function onImageFileSelected(event: Event, off: EditorOffering) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file || !props.characterId) return;

      off.__imageLoading = true;
      try {
        const result = await $api.venues.uploadOfferingImage(props.venueId, props.characterId, file);
        off.imageId = result.id;
        off.imageUrl = result.url;
        emitUpdate();
      } catch (e) {
        notifyError(e);
      } finally {
        off.__imageLoading = false;
        input.value = '';
      }
    }

    async function removeOfferingImage(off: EditorOffering) {
      if (!off.imageId || !props.venueId) return;
      off.__imageLoading = true;
      try {
        await $api.venues.deleteOfferingImage(props.venueId, off.imageId);
        off.imageId = undefined;
        off.imageUrl = undefined;
        emitUpdate();
      } catch (e) {
        notifyError(e);
      } finally {
        off.__imageLoading = false;
      }
    }

    return {
      localCategories,
      confirmDelete,
      onReorder,
      addCategory,
      removeCategory,
      addSubcategory,
      removeSubcategory,
      addOffering,
      removeOffering,
      setFileRef,
      triggerImageUpload,
      onImageFileSelected,
      removeOfferingImage,
    };
  },
});
</script>

<style lang="scss">
.offerings-editor {
  padding: 4px 0;
}

.offerings-editor__category-block {
  border: 1px solid rgba(221, 180, 118, 0.35);
  border-radius: 4px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.7);
  overflow: hidden;
}

body.body--dark .offerings-editor__category-block {
  border-color: rgba(141, 181, 223, 0.28);
  background: rgba(17, 24, 34, 0.7);
}

.offerings-editor__category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(221, 180, 118, 0.12);
  border-bottom: 1px solid rgba(221, 180, 118, 0.25);
}

body.body--dark .offerings-editor__category-header {
  background: rgba(141, 181, 223, 0.1);
  border-bottom-color: rgba(141, 181, 223, 0.2);
}

.offerings-editor__category-name {
  flex: 1;
  font-weight: 600;
  cursor: pointer;
}

.offerings-editor__category-actions {
  display: flex;
  gap: 2px;
  margin-left: auto;
}

.offerings-editor__drag-handle {
  cursor: grab;
  color: rgba(35, 35, 35, 0.4);
  font-size: 16px;
  flex-shrink: 0;
  padding: 0 2px;
  user-select: none;
}

body.body--dark .offerings-editor__drag-handle {
  color: rgba(213, 226, 240, 0.4);
}

.offerings-editor__subcategories {
  padding: 8px 10px 4px 20px;
}

.offerings-editor__subcategory-block {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.5);
}

body.body--dark .offerings-editor__subcategory-block {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.offerings-editor__subcategory-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
}

body.body--dark .offerings-editor__subcategory-header {
  background: rgba(255, 255, 255, 0.04);
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

.offerings-editor__subcategory-name {
  flex: 1;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
}

.offerings-editor__direct-offerings {
  padding: 4px 10px 8px;
}

.offerings-editor__offering-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 3px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.08);
  flex-wrap: wrap;
}

body.body--dark .offerings-editor__offering-item {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
}

.offerings-editor__offering-name {
  flex: 1;
  font-size: 0.9rem;
  min-width: 0;
}

.offerings-editor__offering-price {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

body.body--dark .offerings-editor__offering-price {
  color: rgba(213, 226, 240, 0.6);
}

.offerings-editor__offering-actions {
  display: flex;
  gap: 2px;
  margin-left: auto;
}

.offerings-editor__offering-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.offerings-editor__offering-form-actions {
  display: flex;
  justify-content: flex-end;
}

.offerings-editor__offering-image {
  display: flex;
  align-items: center;
  gap: 8px;
}

.offerings-editor__offering-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 3px;
}

.offerings-editor__file-input {
  display: none;
}

.offerings-editor__name-input {
  flex: 1;
}

.offerings-editor__add-btn {
  margin: 4px 0 6px;
  font-size: 0.8rem;
}

.offerings-editor__add-top-btn {
  margin-top: 8px;
}

.sortable-ghost {
  opacity: 0.5;
}
</style>
