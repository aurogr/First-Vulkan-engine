#pragma once

#include "defines.h"

namespace MiniEngine
{
    class MeshRegistry;
    class ShaderRegistry;
    class Engine;
    class RendererVK;

    struct Runtime
    {
        std::unique_ptr<RendererVK>     m_renderer;
        std::unique_ptr<ShaderRegistry> m_shader_registry;
        std::unique_ptr<MeshRegistry>   m_mesh_registry;
        VkSampler m_pcf_sampler = VK_NULL_HANDLE;
        

        inline const std::array<VkBuffer, kMAX_NUMBER_OF_FRAMES> getPerFrameBuffer() const
        {
            return m_per_frame_buffer;
        }

        inline const std::array<VkBuffer, kMAX_NUMBER_OF_FRAMES> getPerObjectBuffer() const
        {
            return m_per_object_buffer;
        }

        inline const std::array<VkBuffer, kMAX_NUMBER_OF_FRAMES> getPostProccessBuffer() const
        {
            return m_post_process_buffer;
        }

        inline const VkAccelerationStructureKHR& getAccelerationStructure(uint32 idx) const
        {
            return m_tlas[idx];
        }

        inline float getShadowBiasConst() const
        {
            return shadow_bias_enabled;
		}

        inline float getShadowBiasSlope() const
        {
            return shadows_bias_slope;
		}

        inline bool getShadowBiasEnabled() const
        {
            return shadow_bias_enabled;
		}

        inline bool getShadowPCFHardwareEnabled() const
        {
            return shadow_pcf_harware_enabled;
		}

        inline uint32_t getShadowPCFSoftwareSize() const
        {
            return shadow_pcf_software_size;
		}

        inline uint32_t getBloomPingPongPasses() const
        {
            return bloom_pingpong_passes;
		}

        inline bool getRTXShadowsEnabled() const
        {
            return rtx_shadows_enabled;
        }

        inline uint32_t getShadowsSize() const
        {
            return shadows_size;
		}

        inline uint32_t getShadowsLayersNumber() const
        {
            return shadows_layers_number;
		}
        

        inline uint32_t getShadowsMipMapNumber() const
        {
            return shadows_mipmap_number;
		}


    private:
        explicit Runtime() = default;
        ~Runtime() = default;

        Runtime( const Runtime& ) = delete;
        Runtime& operator=(const Runtime& ) = delete;
    
        void createResources();
        void freeResources  ();

        std::array<VkBuffer      , kMAX_NUMBER_OF_FRAMES> m_per_frame_buffer        = { VK_NULL_HANDLE, VK_NULL_HANDLE, VK_NULL_HANDLE};
        std::array<VkDeviceMemory, kMAX_NUMBER_OF_FRAMES> m_per_frame_buffer_memory;

        std::array<VkBuffer       , kMAX_NUMBER_OF_FRAMES> m_per_object_buffer = { VK_NULL_HANDLE, VK_NULL_HANDLE, VK_NULL_HANDLE };
        std::array<VkDeviceMemory, kMAX_NUMBER_OF_FRAMES> m_per_object_buffer_memory;

		std::array<VkBuffer, kMAX_NUMBER_OF_FRAMES> m_post_process_buffer = { VK_NULL_HANDLE, VK_NULL_HANDLE, VK_NULL_HANDLE };
		std::array<VkDeviceMemory, kMAX_NUMBER_OF_FRAMES> m_post_process_buffer_memory;

        // tlas (one for every frame in flight)
        std::array < VkAccelerationStructureKHR, kMAX_NUMBER_OF_FRAMES> m_tlas = { VK_NULL_HANDLE, VK_NULL_HANDLE, VK_NULL_HANDLE };
        std::array<VkBuffer, kMAX_NUMBER_OF_FRAMES> m_tlas_buffer = { VK_NULL_HANDLE, VK_NULL_HANDLE, VK_NULL_HANDLE };
        std::array<VkDeviceMemory, kMAX_NUMBER_OF_FRAMES> m_tlas_memory = { VK_NULL_HANDLE, VK_NULL_HANDLE, VK_NULL_HANDLE };

        // defined on imgui (post-proccess)
        uint32_t bloom_pingpong_passes = 3;

        // defined on imgui (shadows)
        bool shadow_bias_enabled = false;
        float shadows_bias_const = 4.0f;
        float shadows_bias_slope = 5.0f;
        bool shadow_pcf_harware_enabled = false;
        uint32_t shadow_pcf_software_size = 1;

        bool rtx_shadows_enabled = true; // if enabled, it renders shadows with rtx, else, it will render them with shadow mapping


        // defined on script (shadows)
        uint32_t shadows_size = 2048;
        uint32_t shadows_layers_number = 10;
        uint32_t shadows_mipmap_number = 1;

        friend class Engine;
    };
};