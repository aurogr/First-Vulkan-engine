#pragma once

#include "vulkan/renderPassVK.h"

namespace MiniEngine
{
    struct Runtime;
    class MeshVK;
    typedef std::shared_ptr<MeshVK> MeshVKPtr;

    class BloomBlurPassVK final : public RenderPassVK
    {
    public:
        BloomBlurPassVK(
                            const Runtime& i_runtime,
                            const ImageBlock& i_in_brightness_attachment,
                            const ImageBlock& i_output_h_ping_pong_attachment,
                            const ImageBlock& i_output_v_ping_pong_attachment
                          );
        virtual ~BloomBlurPassVK();

        bool            initialize() override;
        void            shutdown  () override;
        VkCommandBuffer draw      ( const Frame& i_frame ) override;

    private:
        BloomBlurPassVK( const BloomBlurPassVK& ) = delete;
        BloomBlurPassVK& operator=(const BloomBlurPassVK& ) = delete;

        void createFbo             ();
        void createRenderPass      ();
        void createPipelines       ();
        void createDescriptorLayout();
        void createDescriptors     ();

        struct PingPongDescriptorSet
        {
            VkDescriptorSet m_descriptor_horizontal_first_pass;
            VkDescriptorSet m_descriptor_horizontal;
            VkDescriptorSet m_descriptor_vertical;
		};

        struct PingPongFBO
        {
            VkFramebuffer m_fbo_horizontal;
            VkFramebuffer m_fbo_vertical;
		};

        VkRenderPass                   m_render_pass;
        std::array<VkCommandBuffer, 3> m_command_buffer;
        std::array<PingPongFBO, 3> m_fbos;

        // prepare the different render supported depending on the material
        VkPipeline                                                         m_composition_pipeline;
        VkPipelineLayout                                                   m_pipeline_layouts;
        VkDescriptorSetLayout                                              m_descriptor_set_layout;
        VkDescriptorPool                                                   m_descriptor_pool;
        std::array<PingPongDescriptorSet, kMAX_NUMBER_OF_FRAMES>           m_descriptor_sets;
        std::array<VkPipelineShaderStageCreateInfo, 2>                     m_shader_stages;
    
        MeshVKPtr m_plane;

        ImageBlock m_in_brightness_attachment;
        ImageBlock m_output_h_ping_pong_attachment;
        ImageBlock m_output_v_ping_pong_attachment;
    };
};
