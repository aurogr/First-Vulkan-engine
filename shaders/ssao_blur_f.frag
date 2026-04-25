#version 460

layout( location = 0 ) in vec2 f_uvs;

layout ( set = 0, binding = 0 ) uniform sampler2D ssao_input;
layout ( set = 0, binding = 1 ) uniform sampler2D position_depth_input;

layout(location = 0) out vec4 out_ssao;

void main() 
{
    // simple blur
    /*vec2 texelSize = 1.0 / vec2(textureSize(ssao_input, 0));
    float result = 0.0;
    for (int x = -2; x < 2; ++x) 
    {
        for (int y = -2; y < 2; ++y) 
        {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            result += texture(ssao_input, f_uvs + offset).r;
        }
    }
    
    float blurredOcclusion = result / 16.0;
    out_ssao = vec4(vec3(blurredOcclusion), 1.0);

    vec3 centerPos = texture(position_depth_input, f_uvs).xyz;
    float centerDepth = centerPos.z;*/
    
    // better blur
    vec2 texelSize = 1.0 / vec2(textureSize(ssao_input, 0));
    vec3 centerPos = texture(position_depth_input, f_uvs).xyz;
    float centerDepth = centerPos.z;

    float result = 0.0;
    float weight = 0.0;

    for (int x = -2; x < 2; ++x) {
        for (int y = -2; y < 2; ++y) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            
            float sampleDepth = texture(position_depth_input, f_uvs + offset).z;
            float sampleAO = texture(ssao_input, f_uvs + offset).r;

            float weight_depth = 1.0 / (0.01 + abs(centerDepth - sampleDepth));
            
            result += sampleAO * weight_depth;
            weight += weight_depth;
        }
    }
    
    float blurredOcclusion = result / weight;
    out_ssao = vec4(vec3(blurredOcclusion), 1.0);
}