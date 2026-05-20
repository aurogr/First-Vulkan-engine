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
            return (uint32_t)shadow_pcf_software_size;
		}

        inline uint32_t getBloomPingPongPasses() const
        {
            return (uint32_t)bloom_pingpong_passes;
		}

        inline uint32_t getShadowMode() const
        {
            return shadow_mode;
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

        inline bool getRTXSoftShadows() const
        {
            return rtx_soft_shadows;
        }

        inline uint32_t getRTXRayNumber() const
        {
            return (uint32_t)rtx_ray_number;
        }

        inline float getRTXConeRadius() const
        {
            return rtx_cone_radius;
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
        int bloom_pingpong_passes = 3;

        // defined on imgui (shadows)
        bool shadow_bias_enabled = true;
        float shadows_bias_const = 4.0f;
        float shadows_bias_slope = 5.0f;
        bool shadow_pcf_harware_enabled = true;
        int shadow_pcf_software_size = 1;

        uint32_t shadow_mode = 0; // 0 no shadows, 1 shadow mapping, 2 rtx shadows
        bool rtx_soft_shadows = true;
        int rtx_ray_number = 4;
        float rtx_cone_radius = 0.1f;

        // defined on script (shadows)
        uint32_t shadows_size = 2048;
        uint32_t shadows_layers_number = 10;
        uint32_t shadows_mipmap_number = 1;

        friend class Engine;
    };
};