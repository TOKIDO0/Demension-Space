package com.example.service;

import com.example.entity.Material;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.mapper.MaterialMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class MaterialService extends ServiceImpl<MaterialMapper, Material> {

    @Resource
    private MaterialMapper materialMapper;

}
