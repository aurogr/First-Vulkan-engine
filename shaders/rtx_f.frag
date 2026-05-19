#version 460

#extension GL_ARB_shader_draw_parameters : enable
#extension GL_EXT_ray_query : enable
#define INV_PI 0.31830988618
#define PI   3.14159265358979323846264338327950288
#define EPSILON   0.001

layout( location = 0 ) in vec2 f_uvs;

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

layout ( set = 0, binding = 1 ) uniform sampler2D i_position_and_depth;
layout ( set = 0, binding = 2 ) uniform sampler2D i_normal;
layout ( set = 0, binding = 3 ) uniform accelerationStructureEXT TLAS;

layout(location = 0) out vec4 out_rtx_shadows;

float evalVisibility(vec3 rayOrigin, vec3 rayDirection, float rayLength)
{
    rayQueryEXT query;
    
    rayQueryInitializeEXT(
        query, 
        TLAS, 
        gl_RayFlagsTerminateOnFirstHitEXT,
        0xFF,
        rayOrigin, 
        EPSILON, 
        rayDirection, 
        rayLength
    );
    
    // Inline traversal loop executed by the RT cores
    while(rayQueryProceedEXT(query)) { }
    
    // If it hit something, this light path is occluded (0.0 visibility)
    if(rayQueryGetIntersectionTypeEXT(query, true) != gl_RayQueryCommittedIntersectionNoneEXT)
    {
        return 0.0; 
    }
    
    return 1.0; // Clear line of sight (1.0 visibility)
}

void main() 
{
    // 1. Fetch G-Buffer data
    vec4 positionData = texture(i_position_and_depth, f_uvs);
    
    // Optional: Skip background pixels if your engine sets a specific mask or depth in .w
    if (positionData.w == 0.0)
    {
        out_rtx_shadows = vec4(1.0); // Sky/Background is fully unshadowed
        return;
    }
    
    vec3 worldPos = positionData.xyz;
    vec3 normal   = normalize(texture(i_normal, f_uvs).xyz);

    // 2. Apply Normal Bias to completely eliminate shadow acne
    vec3 biasedRayOrigin = worldPos + (normal * 0.005);

    uint lightsCount = per_frame_data.m_number_of_lights;
    if (lightsCount == 0)
    {
        out_rtx_shadows = vec4(1.0); 
        return;
    }

    // 3. Loop through every active light and trace a ray toward it
    float accumulatedVisibility = 0.0;
    
    for (uint i = 0; i < lightsCount; ++i)
    {
        vec3 lightPos = per_frame_data.m_lights[i].m_light_pos.xyz;
        
        vec3 rayVector = lightPos - biasedRayOrigin;
        float rayLength = length(rayVector);
        vec3 rayDirection = normalize(rayVector);

        // Trace a unique ray for this specific light source
        accumulatedVisibility += evalVisibility(biasedRayOrigin, rayDirection, rayLength);
    }

    // 4. Calculate final average visibility factor across all lights
    float finalShadowFactor = accumulatedVisibility / float(lightsCount);

    // Output the scalar shadow mask to your dedicated texture for the denoiser pass
    out_rtx_shadows = vec4(vec3(finalShadowFactor), 1.0);
}