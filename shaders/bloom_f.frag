#version 460

layout( location = 0 ) in vec2 f_uvs;

layout (push_constant) uniform Block {
    uint horizontal;
} push;

layout ( set = 0, binding = 0 ) uniform sampler2D i_texture;

layout(location = 0) out vec4 out_color;

const float weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main() 
{
    vec2 tex_offset = 1.0 / textureSize(i_texture, 0);  // gets size of single texel
    vec3 result = texture(i_texture, f_uvs).rgb * weight[0]; // current fragment's contribution

    if(push.horizontal == 1) {
        for(int i = 1; i < 5; ++i) {
            result += texture(i_texture, f_uvs + vec2(tex_offset.x * i, 0.0)).rgb * weight[i];
            result += texture(i_texture, f_uvs - vec2(tex_offset.x * i, 0.0)).rgb * weight[i];
        }
    } else {
        for(int i = 1; i < 5; ++i) {
            result += texture(i_texture, f_uvs + vec2(0.0, tex_offset.y * i)).rgb * weight[i];
            result += texture(i_texture, f_uvs - vec2(0.0, tex_offset.y * i)).rgb * weight[i];
        }
    }
    
    out_color = vec4(result, 1.0);
}