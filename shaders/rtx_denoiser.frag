#version 460

#extension GL_ARB_shader_draw_parameters : enable
#extension GL_EXT_ray_query : enable
#define INV_PI 0.31830988618
#define PI   3.14159265358979323846264338327950288
#define EPSILON   0.01

layout( location = 0 ) in vec2 f_uvs;

layout (push_constant) uniform Block {
    uint soft_shadows;
    uint KERNEL_SIZE;
    float SIGMA_DEPTH;
    float EDGE_SHARPNESS;
} push;

layout ( set = 0, binding = 0 ) uniform sampler2D i_position_and_depth;
layout ( set = 0, binding = 1 ) uniform sampler2D i_normal;
layout ( set = 0, binding = 2 ) uniform sampler2D i_rtx_shadows;

layout(location = 0) out vec4 out_rtx_shadows;



float calculateSpatialWeight(float distance, float sigma) {
    return 0.39894 * exp(-0.5 * distance * distance / (sigma * sigma)) / sigma;
}

void main() 
{
    if (push.soft_shadows == 0)
    { 
        vec4 shadowData = texture(i_rtx_shadows, f_uvs);

        out_rtx_shadows = vec4(vec3(shadowData), 1.0);

        return;
    } 
    
    vec3 centerNormal = texture(i_normal, f_uvs).rgb;
    float centerDepth = texture(i_position_and_depth, f_uvs).r;
    float centerShadow = texture(i_rtx_shadows, f_uvs).r;

    // background pixels
    if (centerDepth == 0.0) {
        out_rtx_shadows = vec4(vec3(centerShadow), 1.0);
        return;
    }

    float totalWeight = 0.0;
    float filteredShadow = 0.0;
    
    vec2 texelSize = 1.0 / textureSize(i_rtx_shadows, 0);

    int kernel_radius = int(push.KERNEL_SIZE) / 2;
    float SIGMA_SPATIAL = float(kernel_radius) / 3.0;

    for (int x = -kernel_radius; x <= kernel_radius; ++x) 
    {
        for (int y = -kernel_radius; y <= kernel_radius; ++y) 
        {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            vec2 sampleUV = f_uvs + offset;

            // neighbor propertines
            vec3 neighborNormal  = texture(i_normal, sampleUV).rgb;
            float neighborDepth  = texture(i_position_and_depth, sampleUV).r;
            float neighborShadow = texture(i_rtx_shadows, sampleUV).r;

            // spatial distance
            float spatialDist = length(vec2(x, y));
            float w_spatial   = calculateSpatialWeight(spatialDist, SIGMA_SPATIAL);

            // depth discontinuity
            float depthDiff = abs(centerDepth - neighborDepth);
            float w_depth   = exp(-depthDiff / push.SIGMA_DEPTH);

            // normal angle deviation
            float normalDot = max(dot(centerNormal, neighborNormal), 0.0);
            float w_normal  = pow(normalDot, push.EDGE_SHARPNESS);

            // combine weights
            float finalWeight = w_spatial * w_depth * w_normal;

            filteredShadow += neighborShadow * finalWeight;
            totalWeight += finalWeight;
        }
    }

    if (totalWeight > 0.0) {
        out_rtx_shadows = vec4(vec3(filteredShadow / totalWeight), 1.0);
    } else {
        out_rtx_shadows = vec4(vec3(centerShadow), 1.0);
    }
   
}