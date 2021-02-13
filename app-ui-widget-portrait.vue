<!--
**
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
**
-->

<template>
    <div v-bind:style="style" class="portrait">
        <div class="portrait-row">
            <div class="portrait-col portrait">
                <!-- portrait -->
                <div v-bind:class="{ border: true, editing: editing }">
                    <div v-show="!editing" class="preview-wrap"
                        v-tooltip.left="{ content: $t('portrait.canvas-preview-tooltip') }">
                        <!-- preview -->
                        <img
                            ref="preview"
                            class="preview"
                            v-bind:src="value"
                            v-on:click="editImage"
                            alt="Portrait"
                        />
                    </div>
                    <div v-show="editing" class="cropper-wrap"
                        v-tooltip.left="{ content: $t('portrait.canvas-edit-tooltip') }">
                        <!-- editor -->
                        <img ref="cropper"
                            class="cropper"
                            v-bind:src="value"
                            alt="Portrait"
                        />
                    </div>
                </div>
            </div>
            <div class="portrait-col chooser">
                <div class="portrait-row">
                    <!-- avatars -->
                    <div class="portrait-col">
                        <img ref="avatar-man"
                            class="avatar avatar-man"
                            v-bind:src="avatarMan"
                            v-tooltip.left="{ content: $t('portrait.avatar-male-tooltip') }"
                            v-on:click="chooseAvatar('man')"
                        />
                    </div>
                    <div class="portrait-col">
                        <img ref="avatar-woman"
                            class="avatar avatar-woman"
                            v-bind:src="avatarWoman"
                            v-tooltip.right="{ content: $t('portrait.avatar-female-tooltip') }"
                            v-on:click="chooseAvatar('woman')"
                        />
                    </div>
                </div>
                <div class="portrait-row">
                    <!-- button -->
                    <button v-show="!editing"
                        class="choose"
                        type="button"
                        v-tooltip.top="{ content: $t('portrait.edit-tooltip') }"
                        v-on:click="chooseFile"
                        v-html="$t('portrait.edit-button')">
                    </button>
                    <button v-show="editing"
                        class="fixate"
                        type="button"
                        v-tooltip.top="{ content: $t('portrait.fixate-tooltip') }"
                        v-on:click="fixateImage"
                        v-html="$t('portrait.fixate-button')">
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.portrait {
    /*  dialog box  */
    width:  100%;
    height: 100%;
    background-color:        var(--color-std-bg-4);
    border-top:    1px solid var(--color-std-bg-1);
    border-left:   1px solid var(--color-std-bg-1);
    border-right:  1px solid var(--color-std-bg-5);
    border-bottom: 1px solid var(--color-std-bg-5);

    /*  general layout  */
    .portrait-row {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
    .portrait-col {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    /*  special layouts  */
    .portrait-col.portrait {
        width:  calc(150px - 20px);
        height: calc(150px - 20px);
        border: 10px;
        .border {
            width: 130px;
            height: 130px;
            margin: 7px;
            border: 3px solid transparent;
            &:hover {
                border: 3px solid var(--color-sig-bg-3);
            }
            &.editing {
                border: 3px solid var(--color-acc-bg-3);
            }
            .preview-wrap {
                cursor: pointer;
                width:  100%;
                height: 100%;
                .preview {
                    width:  100%;
                    height: 100%;
                }
            }
            .cropper-wrap {
                width:  100%;
                height: 100%;
                .cropper {
                    width: 100%;
                    height: 100%;
                    display: block;
                    max-width: 100%;
                }
            }
        }
    }
    .portrait-col.chooser {
        width:  calc(150px - 10px);
        height: calc(150px - 20px);
        margin: 10px;
        margin-left: 0;
        .avatar {
            width: 63px;
            border: 2px solid transparent;
            &:hover {
                border: 2px solid var(--color-sig-bg-3);
            }
            cursor: pointer;
        }
        .choose {
            width: 100%;
            height: 55px;
            font-size: 10pt;
            color:                   var(--color-std-fg-3);
            background-color:        var(--color-std-bg-4);
            border-top:    1px solid var(--color-std-bg-5);
            border-left:   1px solid var(--color-std-bg-5);
            border-right:  1px solid var(--color-std-bg-1);
            border-bottom: 1px solid var(--color-std-bg-1);
            border-radius: 5px;
            outline: none;
            cursor: pointer;
            &:hover {
                color:                   var(--color-sig-fg-3);
                background-color:        var(--color-sig-bg-4);
                border-top:    1px solid var(--color-sig-bg-5);
                border-left:   1px solid var(--color-sig-bg-5);
                border-right:  1px solid var(--color-sig-bg-1);
                border-bottom: 1px solid var(--color-sig-bg-1);
            }
        }
        .fixate {
            width: 100%;
            height: 55px;
            font-size: 10pt;
            color:                   var(--color-acc-fg-3);
            background-color:        var(--color-acc-bg-4);
            border-top:    1px solid var(--color-acc-bg-5);
            border-left:   1px solid var(--color-acc-bg-5);
            border-right:  1px solid var(--color-acc-bg-1);
            border-bottom: 1px solid var(--color-acc-bg-1);
            border-radius: 5px;
            outline: none;
            cursor: pointer;
            &:hover {
                color:                   var(--color-sig-fg-3);
                background-color:        var(--color-sig-bg-4);
                border-top:    1px solid var(--color-sig-bg-5);
                border-left:   1px solid var(--color-sig-bg-5);
                border-right:  1px solid var(--color-sig-bg-1);
                border-bottom: 1px solid var(--color-sig-bg-1);
            }
        }
    }
}
</style>

<script>
module.exports = {
    name: "portrait",

    /*  component static properties  */
    props: {
        value: { type: String, default: "" }
    },

    /*  component variable properties  */
    data: () => ({
        imageFile:   "",
        imageData:   "",
        avatarMan:   ui.avatar.man,
        avatarWoman: ui.avatar.woman,
        editing:     false,
        cropper:     null
    }),

    /*  component computed properties  */
    computed: {
        style: ui.vueprop2cssvar()
    },

    /*  component methods  */
    methods: {
        /*  select a standard avatar (and fixate it)  */
        chooseAvatar (name) {
            this.imageData = ui.avatar[name]
            this.$emit("input", this.imageData)
        },

        /*  choose a custom portrait image  */
        chooseFile () {
            ui.bridge.showOpenDialog({
                title:       this.$t("portrait.choose-title"),
                properties:  [ "openFile" ],
                filters:     [ { name: "Image", extensions: [ "png", "jpg", "gif", "svg" ] } ],
                defaultPath: this.imageFile
            }).then(async (result) => {
                if (result.canceled)
                    return
                if (result.filePaths && result.filePaths.length === 1) {
                    /*  edit the image  */
                    this.imageFile = result.filePaths[0]
                    this.imageData = await ui.imageDataURI.encodeFromFile(this.imageFile)
                    this.editImage()
                }
            })
        },

        /*  edit the portrait image  */
        editImage () {
            this.cropper.replace(this.imageData)
            this.editing = true
        },

        /*  fixate the portrait image  */
        async fixateImage () {
            this.editing = false
            let data = this.cropper.getCroppedCanvas()
            if (data !== null) {
                /*  import canvas element into Jimp image  */
                data = await new Promise((resolve) => data.toBlob(resolve))
                data = await data.arrayBuffer()
                const img = await jimp.read(data)

                /*  optionally resize image  */
                if (img.bitmap.width > 300)
                    img.resize(300, jimp.AUTO, jimp.RESIZE_BILINEAR)
                if (img.bitmap.height > 300)
                    img.resize(jimp.AUTO, 300, jimp.RESIZE_BILINEAR)

                /*  export Jimp image as a JPEG Data-URI  */
                img.quality(80)
                this.imageData = await img.getBase64Async(jimp.MIME_JPEG)
            }
            this.$emit("input", this.imageData)
        }
    },

    /*  component DOM mounting hook  */
    mounted () {
        /*  take over portrait image or provide default avatar  */
        if (this.value !== "")
            this.imageData = this.value
        else {
            this.imageData = ui.avatar.man
            this.$emit("input", this.imageData)
        }

        /*  initialize Cropper widget  */
        this.cropper = new Cropper(this.$refs.cropper, {
            viewMode: 2,
            dragMode: "move",
            aspectRatio: 1.0,
            responsive: false,
            modal: false,
            guides: false,
            highlight: false,
            background: false,
            movable: true,
            rotatable: false,
            scalable: true,
            zoomable: true,
            cropBoxMovable: true,
            toggleDragModeOnDblclick: false,
            minContainerWidth:  130,
            minContainerHeight: 130,
            minCanvasWidth:     130,
            minCanvasHeight:    130,
            minCropBoxWidth:    130,
            minCropBoxHeight:   130
        })
    }
}
</script>

