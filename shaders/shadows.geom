#version 460

layout(triangles, invocations = 10) in;
layout(triangle_strip, max_vertices = 3) out;

#extension GL_ARB_shader_draw_parameters : enable

layout( location = 0 ) in vec3 g_position[];

//globals
struct LightData
{
    vec4 m_light_pos;
    vec4 m_radiance;
    vec4 m_attenuattion;
    mat4 m_view_projection;
};

layout( std140, set = 0, binding = 0 ) uniform PerFrameData
{
    vec4      m_camera_pos;
    mat4      m_view;
    mat4      m_projection;
    mat4      m_view_projection;
    mat4      m_inv_view;
    mat4      m_inv_projection;
    mat4      m_inv_view_projection;
    vec4      m_clipping_planes;
    LightData m_lights[ 10 ];
    uint      m_number_of_lights;
} per_frame_data;



void main() {
    
    int light_index = gl_InvocationID;

    if (light_index >= per_frame_data.m_number_of_lights) {
        return;
    }

    gl_Layer = light_index;
    
    for (int j = 0; j < 3; ++j){
        gl_Position = per_frame_data.m_lights[light_index].m_view_projection * vec4(g_position[j], 1.0);

        EmitVertex();
    }
    EndPrimitive();
}