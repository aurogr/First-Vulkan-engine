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

        inline uint32_t getBloomPingPongPasses() const
        {
            return bloom_pingpong_passes;
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

        uint32_t bloom_pingpong_passes = 3;

        friend class Engine;
    };
};