<!--
**
**  Live ~~ Live Video-Streaming Frontend
**  Copyright (c) 2020 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
**
-->

<template>
    <div v-bind:style="style" class="portrait">
        <div class="portrait-row">
            <div class="portrait-col portrait">
                <div v-bind:class="{ border: true, editing: editing }">
                    <div v-show="!editing" class="preview-wrap">
                        <img
                            ref="preview"
                            class="preview"
                            v-bind:src="value"
                            v-on:click="editImage"
                            alt="Portrait"
                        />
                    </div>
                    <div v-show="editing" class="cropper-wrap">
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
                    <div class="portrait-col">
                        <img ref="avatar-man"
                            class="avatar avatar-man"
                            v-bind:src="avatarMan"
                            v-on:click="chooseAvatar('man')"
                            alt="Avatar Man"
                        />
                    </div>
                    <div class="portrait-col">
                        <img ref="avatar-woman"
                            class="avatar avatar-woman"
                            v-bind:src="avatarWoman"
                            v-on:click="chooseAvatar('woman')"
                            alt="Avatar Man"
                        />
                    </div>
                </div>
                <div class="portrait-row">
                    <button v-show="!editing"
                        class="choose"
                        type="button"
                        v-on:click="chooseFile">
                        Choose Custom<br/>
                        Portrait Image
                    </button>
                    <button v-show="editing"
                        class="fixate"
                        type="button"
                        v-on:click="fixateImage">
                        Fixate Edited<br/>
                        Portrait Image
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.portrait {
    width:  100%;
    height: 100%;
    background-color:        var(--color-std-bg-4);
    border-top:    1px solid var(--color-std-bg-1);
    border-left:   1px solid var(--color-std-bg-1);
    border-right:  1px solid var(--color-std-bg-5);
    border-bottom: 1px solid var(--color-std-bg-5);
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
    .portrait-col.portrait {
        width:  calc(150px - 20px);
        height: calc(150px - 20px);
        .border {
            width: 130px;
            height: 130px;
            margin: 7px;
            border: 3px solid transparent;
            &.editing {
                border: 3px solid var(--color-acc-bg-3);
            }
            .preview-wrap {
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
    props: {
        value: ""
    },
    data: () => ({
        imageFile:   "",
        imageData:   "",
        avatarMan:   ui.avatar.man,
        avatarWoman: ui.avatar.woman,
        editing:     false,
        cropper:     null
    }),
    computed: {
        style: ui.vueprop2cssvar()
    },
    methods: {
        /*  select a standard avatar (and fixate it)  */
        chooseAvatar (name) {
            this.imageData = ui.avatar[name]
            this.fixateImage()
        },

        /*  choose a custom portrait image  */
        chooseFile () {
            ui.remote.dialog.showOpenDialog({
                title:       "Choose Custom Portrait Image File",
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
        fixateImage () {
            this.editing = false
            const data = this.cropper.getCroppedCanvas()
            if (data !== null)
                this.imageData = data.toDataURL()
            this.$emit("input", this.imageData)
        }
    },
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

