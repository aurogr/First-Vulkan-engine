#pragma once

#include "vulkan/renderPassVK.h"

namespace MiniEngine
{
    struct Runtime;
    class MeshVK;
    typedef std::shared_ptr<MeshVK> MeshVKPtr;

    class RtxPassVK final : public RenderPassVK
    {
    public:
        RtxPassVK(
                            const Runtime& i_runtime,
                            const ImageBlock& i_in_position_depth_attachment,
                            const ImageBlock& i_in_normal_attachment,
                            const ImageBlock& i_rtx_attachment
                          );
        virtual ~RtxPassVK();

        bool            initialize() override;
        void            shutdown  () override;
        VkCommandBuffer draw      ( const Frame& i_frame ) override;

    private:
        RtxPassVK( const RtxPassVK& ) = delete;
        RtxPassVK& operator=(const RtxPassVK& ) = delete;

        void createFbo             ();
        void createRenderPass      ();
        void createPipelines       ();
        void createDescriptorLayout();
        void createDescriptors     ();

        VkRenderPass                   m_render_pass;
        std::array<VkCommandBuffer, 3> m_command_buffer;
        std::array<VkFramebuffer, 3>   m_fbos;

        // prepare the different render supported depending on the material
        VkPipeline                                                         m_pipeline;
        VkPipelineLayout                                                   m_pipeline_layouts;
        VkDescriptorSetLayout                                              m_descriptor_set_layout;
        VkDescriptorPool                                                   m_descriptor_pool;
        std::array<VkDescriptorSet, kMAX_NUMBER_OF_FRAMES>                 m_descriptor_sets;
        std::array<VkPipelineShaderStageCreateInfo, 2                    > m_shader_stages;
    
        MeshVKPtr m_plane;

        ImageBlock m_in_position_depth_attachment;
        ImageBlock m_in_normal_attachment;
        ImageBlock m_rtx_attachment;

        bool m_need_layout_cleanup = true;
    };
};
